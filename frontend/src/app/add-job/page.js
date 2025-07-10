"use client";

import { useState } from "react";
import API from "@/app/lib/api";
import { useRouter } from "next/navigation";

export default function AddJobPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    job_type: "Full-time",
    tags: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await API.post("/jobs", form);
      alert("Job posted successfully!");
      router.push("/"); // Go back to job list
    } catch (err) {
      alert("Error creating job");
      console.error(err);
    }
  };

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Post a New Job</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {["title", "company", "location", "tags"].map((field) => (
          <input
            key={field}
            type="text"
            name={field}
            placeholder={field}
            value={form[field]}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded"
            required={field !== "tags"}
          />
        ))}

        <select
          name="job_type"
          value={form.job_type}
          onChange={handleChange}
          className="w-full border px-3 py-2 rounded"
        >
          <option>Full-time</option>
          <option>Part-time</option>
          <option>Internship</option>
          <option>Contract</option>
        </select>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Post Job
        </button>
      </form>
    </main>
  );
}
