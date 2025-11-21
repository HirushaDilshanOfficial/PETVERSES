// Controllers/faqController.js
import Faq from "../Models/Faq.js";

// Add FAQ
export const addFaq = async (req, res) => {
  try {
    const { question, answer, category } = req.body;
    const faq = new Faq({ question, answer, category });
    await faq.save();
    res.status(201).json({ success: true, faq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get FAQs
export const getFaqs = async (req, res) => {
  try {
    const faqs = await Faq.find().sort({ createdAt: -1 });
    res.json({ success: true, faqs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update FAQ
export const updateFaq = async (req, res) => {
  try {
    const faq = await Faq.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!faq) return res.status(404).json({ success: false, message: "FAQ not found" });
    res.json({ success: true, faq });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Delete FAQ
export const deleteFaq = async (req, res) => {
  try {
    const faq = await Faq.findByIdAndDelete(req.params.id);
    if (!faq) return res.status(404).json({ success: false, message: "FAQ not found" });
    res.json({ success: true, message: "FAQ deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};