"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [role, setRole] = useState("Customer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [vehicleReg, setVehicleReg] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

 const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();

  const res = await fetch("/api/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      full_name: fullName,
      email,
      phone,
      password,
      role,
      address,
      license_number: licenseNumber,
      vehicle_type: vehicleType,
      vehicle_registration: vehicleReg,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.error);
    return;
  }

  alert("Registration successful!");
  router.push("/login");
};

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-2xl">
        <h1 className="text-3xl font-bold text-center mb-6 text-black">
          Water Delivery Registration
        </h1>

        <form onSubmit={handleRegister}>
          {/* Role */}
          <div className="mb-4">
            <label className="block font-medium mb-2 text-black">
              Register As
            </label>

            <select
              className="w-full border p-3 rounded text-black"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option>Customer</option>
              <option>Driver</option>
            </select>
          </div>

          {/* Full Name */}
          <div className="mb-4">
            <label className="block font-medium mb-2 text-black">
              Full Name
            </label>

            <input
              type="text"
              className="w-full border p-3 rounded text-black"
              placeholder="Enter full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          {/* Email */}
          <div className="mb-4">
            <label className="block font-medium mb-2 text-black">
              Email
            </label>

            <input
              type="email"
              className="w-full border p-3 rounded text-black"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Phone */}
          <div className="mb-4">
            <label className="block font-medium mb-2 text-black">
              Phone Number
            </label>

            <input
              type="text"
              className="w-full border p-3 rounded text-black"
              placeholder="Enter phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          {/* Customer Address */}
          {role === "Customer" && (
            <div className="mb-4">
              <label className="block font-medium mb-2 text-black">
                Delivery Address
              </label>

              <textarea
                className="w-full border p-3 rounded text-black"
                placeholder="Enter delivery address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
          )}

          {/* Driver Fields */}
          {role === "Driver" && (
            <>
              <div className="mb-4">
                <label className="block font-medium mb-2 text-black">
                  License Number
                </label>

                <input
                  type="text"
                  className="w-full border p-3 rounded text-black"
                  placeholder="Enter license number"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block font-medium mb-2 text-black">
                  Vehicle Type
                </label>

                <input
                  type="text"
                  className="w-full border p-3 rounded text-black"
                  placeholder="Enter vehicle type"
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block font-medium mb-2 text-black">
                  Vehicle Registration
                </label>

                <input
                  type="text"
                  className="w-full border p-3 rounded text-black"
                  placeholder="Enter vehicle registration"
                  value={vehicleReg}
                  onChange={(e) => setVehicleReg(e.target.value)}
                  required
                />
              </div>
            </>
          )}

          {/* Password */}
          <div className="mb-4">
            <label className="block font-medium mb-2 text-black">
              Password
            </label>

            <input
              type="password"
              className="w-full border p-3 rounded text-black"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {/* Confirm Password */}
          <div className="mb-6 text-black">
            <label className="block font-medium mb-2 text-black">
              Confirm Password
            </label>

            <input
              type="password"
              className="w-full border p-3 rounded"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700"
          >
            Register
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-gray-600">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-blue-600 font-semibold"
          >
            Login
          </a>
        </p>
      </div>
    </div>
  );
}