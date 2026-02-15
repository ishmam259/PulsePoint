import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { prescriptionsAPI } from "../services/api";

export default function PrescriptionModal({ appointment, onClose }) {
  const queryClient = useQueryClient();
  const [medications, setMedications] = useState([
    { medicine_name: "", dosage: "", duration: "" },
  ]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const addMedication = () => {
    setMedications([
      ...medications,
      { medicine_name: "", dosage: "", duration: "" },
    ]);
  };

  const removeMedication = (index) => {
    const newMeds = [...medications];
    newMeds.splice(index, 1);
    setMedications(newMeds);
  };

  const updateMedication = (index, field, value) => {
    const newMeds = [...medications];
    newMeds[index][field] = value;
    setMedications(newMeds);
  };

  const createMutation = useMutation({
    mutationFn: (data) => prescriptionsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["appointments"]);
      alert("Prescription created successfully!");
      onClose();
    },
    onError: (err) => {
      setError(err.response?.data?.error || "Failed to create prescription");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (medications.some((m) => !m.medicine_name || !m.dosage || !m.duration)) {
      setError("Please fill in all medication fields");
      return;
    }

    createMutation.mutate({
      appointment_id: appointment.appointment_id,
      notes,
      medications,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white text-slate-900 border border-slate-200 dark:bg-slate-900 dark:text-white dark:border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center sticky top-0 bg-white dark:bg-slate-900 z-10">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Write Prescription
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 p-4 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700/50">
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400 mb-2">
              <span>
                Patient:{" "}
                <span className="text-slate-900 dark:text-white font-medium">
                  {appointment.patient_name}
                </span>
              </span>
              <span>
                Date:{" "}
                <span className="text-slate-900 dark:text-white font-medium">
                  {new Date(appointment.appt_date).toLocaleDateString()}
                </span>
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Medications
              </h3>
              <button
                type="button"
                onClick={addMedication}
                className="text-emerald-600 hover:text-emerald-500 dark:text-emerald-400 dark:hover:text-emerald-300 text-sm font-medium flex items-center gap-1"
              >
                + Add Medicine
              </button>
            </div>

            {medications.map((med, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-3 items-start animate-fade-in"
              >
                <div className="col-span-5">
                  <input
                    type="text"
                    placeholder="Medicine Name"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-emerald-500 outline-none"
                    value={med.medicine_name}
                    onChange={(e) =>
                      updateMedication(index, "medicine_name", e.target.value)
                    }
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="text"
                    placeholder="Dosage"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-emerald-500 outline-none"
                    value={med.dosage}
                    onChange={(e) =>
                      updateMedication(index, "dosage", e.target.value)
                    }
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="text"
                    placeholder="Duration"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-slate-900 dark:text-white text-sm focus:border-emerald-500 outline-none"
                    value={med.duration}
                    onChange={(e) =>
                      updateMedication(index, "duration", e.target.value)
                    }
                  />
                </div>
                <div className="col-span-1 flex justify-center pt-2">
                  {medications.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMedication(index)}
                      className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Notes
            </h3>
            <textarea
              placeholder="Additional instructions, diagnosis, etc."
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-slate-900 dark:text-white text-sm focus:border-emerald-500 outline-none min-h-[100px]"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center h-10 px-6 rounded-lg text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="bg-[#3AAFA9] hover:bg-[#2d9d97] text-white transition-colors"
              style={{
                height: "42px",
                padding: "0 24px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                boxShadow: "0 4px 6px -1px rgba(58, 175, 169, 0.2)"
              }}
            >
              {createMutation.isPending ? "Creating..." : "Save Prescription"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
