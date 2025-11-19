import Appointment from "../Models/Appointment.js";
import User from "../Models/User.js";
import Service from "../Models/Service.js";
import mongoose from "mongoose";
import {
  sendAppointmentApprovalEmail,
  sendAppointmentRejectionEmail,
} from "../Utils/emailService.js";

// Create new appointment
export const createAppointment = async (req, res) => {
  try {
    // Use the authenticated user's ID instead of relying on client-side data
    if (!req.user || !req.user.firebaseUid) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Override the user_id with the authenticated user's firebaseUid
    const appointmentData = {
      ...req.body,
      user_id: req.user.firebaseUid,
    };

    const appointment = new Appointment(appointmentData);
    const savedAppointment = await appointment.save();
    res.status(201).json(savedAppointment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all appointments
export const getAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find();
    res.status(200).json(appointments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get appointments for a specific service provider
export const getProviderAppointments = async (req, res) => {
  try {
    console.log("getProviderAppointments called");

    // Check if user is authenticated
    if (!req.user || !req.user.userId) {
      console.log("User not authenticated:", req.user);
      return res.status(401).json({ error: "User not authenticated" });
    }

    // Get the service provider's user ID
    const providerId = req.user.userId;
    console.log("Provider ID:", providerId);

    // Validate providerId
    if (!mongoose.Types.ObjectId.isValid(providerId)) {
      console.log("Invalid provider ID:", providerId);
      return res.status(400).json({ error: "Invalid provider ID" });
    }

    // Find all services created by this provider
    console.log("Finding services for provider:", providerId);

    // Convert providerId to ObjectId for proper querying
    const providerObjectId = new mongoose.Types.ObjectId(providerId);

    // Use proper MongoDB syntax for querying nested fields
    const services = await Service.find({
      "provider.userId": providerObjectId,
    });

    console.log("Found services:", services.length);

    // Extract service IDs as strings for matching with appointment service_id
    const serviceIds = services.map((service) => service._id.toString());
    console.log("Service IDs (as strings):", serviceIds);

    // If no services found, return empty array
    if (serviceIds.length === 0) {
      console.log("No services found for provider, returning empty array");
      return res.status(200).json([]);
    }

    // Find appointments for these services
    console.log("Finding appointments for service IDs:", serviceIds);
    const appointments = await Appointment.find({
      service_id: { $in: serviceIds },
    });

    console.log("Found appointments:", appointments.length);
    res.status(200).json(appointments);
  } catch (err) {
    console.error("Error in getProviderAppointments:", err);
    console.error("Error stack:", err.stack);
    res.status(500).json({
      error:
        "Internal server error while fetching appointments: " + err.message,
    });
  }
};

// Get appointment by ID
export const getAppointmentById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res.status(200).json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update appointment
export const updateAppointment = async (req, res) => {
  try {
    const { status } = req.body;
    const appointmentId = req.params.id;

    // Validate appointment ID format
    if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    // Get the current appointment to check for status changes
    const currentAppointment = await Appointment.findById(appointmentId);
    if (!currentAppointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check if the user is authorized to update this appointment
    // (i.e., they are the service provider who created the service)
    if (req.user && req.user.userId) {
      const providerId = req.user.userId;

      // Find the service associated with this appointment
      const service = await Service.findById(currentAppointment.service_id);

      // Check if the service exists and belongs to the authenticated provider
      if (
        service &&
        service.provider.userId.toString() === providerId.toString()
      ) {
        // User is authorized, proceed with update
        const updatedAppointment = await Appointment.findByIdAndUpdate(
          appointmentId,
          req.body,
          { new: true }
        );

        // Note: Loyalty points are now awarded only upon successful payment
        // See paymentController for the awarding logic.

        res.status(200).json(updatedAppointment);
      } else {
        // User is not authorized
        return res
          .status(403)
          .json({ error: "Not authorized to update this appointment" });
      }
    } else {
      // No authentication info, proceed with update (for backward compatibility)
      const updatedAppointment = await Appointment.findByIdAndUpdate(
        appointmentId,
        req.body,
        { new: true }
      );

      res.status(200).json(updatedAppointment);
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete appointment
export const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    const deletedAppointment = await Appointment.findByIdAndDelete(id);
    if (!deletedAppointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    res.status(200).json({ message: "Appointment deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
