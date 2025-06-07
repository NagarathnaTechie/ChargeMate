import mongoose from "mongoose";
import bcrypt from "bcryptjs";


const vehicleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  number: { type: String, required: true },
  connectorType: { type: String, required: true },
  batteryCapacity: { type: String },
  range: { type: String },
});

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: false },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  vehicles: [vehicleSchema],
},
{timestamps: true}
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) 
    return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const User = mongoose.model("User", userSchema);
export default User;
