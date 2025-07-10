"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import API from "@/app/lib/api";

export default function EditJobPage() {
  const { id } = useParams();
  const router = useRouter();

  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    job_type: "Full-time",
    tags: "",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/jobs/${id}`)
      .then((res) => {
        const job = res.data;
        setForm({
          title: job.title,
          company: job.company,
          location: job.location,
          job_type: job.job_type,
          tags: job.tags.join(", "),
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load job", err);
        setLoading(false);
      });
  }, [id]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/jobs/${id}`, form);
      alert("Job updated!");
      router.push("/");
    } catch (err) {
      console.error("Update failed", err);
      alert("Failed to update job");
    }
  };

  if (loading) return <p className="p-6 text-gray-500">Loading job data...</p>;

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">✏️ Edit Job</h1>
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
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Save Changes
        </button>
      </form>
    </main>
  );
}
