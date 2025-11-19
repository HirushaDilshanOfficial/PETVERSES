// Simple test to verify the loyalty point deduction logic
console.log("=== Loyalty Point Deduction Logic Test ===");

// Test the Math.max function used in the deduction logic
const userPoints = 50;
const pointsRedeemed = 20;

console.log(`User has ${userPoints} points`);
console.log(`User wants to redeem ${pointsRedeemed} points`);

const newPoints = Math.max(0, userPoints - pointsRedeemed);
console.log(`After deduction: ${newPoints} points`);

// Test edge case where user tries to redeem more points than they have
const userPoints2 = 10;
const pointsRedeemed2 = 20;

console.log(`\nUser has ${userPoints2} points`);
console.log(`User wants to redeem ${pointsRedeemed2} points`);

const newPoints2 = Math.max(0, userPoints2 - pointsRedeemed2);
console.log(`After deduction: ${newPoints2} points (should not be negative)`);

console.log("\n=== Logic Test Completed ===");
