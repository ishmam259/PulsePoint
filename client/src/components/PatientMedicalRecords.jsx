import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { medicalRecordsAPI } from "../services/api";

export default function PatientMedicalRecords({ userId }) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    record_type: "Report",
    description: "",
    record_date: new Date().toISOString().split("T")[0],
    file_url: "",
  });

  const { data: records, isLoading } = useQuery({
    queryKey: ["medicalRecords", userId],
    queryFn: async () => (await medicalRecordsAPI.getAll()).data,
  });

  const createMutation = useMutation({
    mutationFn: (data) => medicalRecordsAPI.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(["medicalRecords"]);
      setShowForm(false);
      setFormData({
        title: "",
        record_type: "Report",
        description: "",
        record_date: new Date().toISOString().split("T")[0],
        file_url: "",
      });
    },
    onError: (error) => {
      alert(
        "Failed to create record: " +
        (error.response?.data?.error || error.message),
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => medicalRecordsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries(["medicalRecords"]);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const getIcon = (type) => {
    switch (type) {
      case "Report":
        return "";
      case "Prescription":
        return "";
      case "Lab":
        return "";
      default:
        return "";
    }
  };

  if (isLoading)
    return (
      <div className="p-8 text-center text-slate-400">Loading records...</div>
    );

  return (
    <div className="space-y-6 animate-fade-in w-full flex flex-col items-center">


      <div className="flex justify-between items-center mb-6 w-2/3 mx-auto">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            My Medical Records
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Keep track of your reports, prescriptions, and lab results
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`inline-flex items-center justify-center gap-2 h-11 text-white rounded-xl shadow-lg transition-all transform hover:translate-y-[-1px] ${
            showForm
              ? "bg-slate-500 hover:bg-slate-600 shadow-slate-500/20"
              : "bg-[#3AAFA9] hover:bg-[#2d9d97] shadow-[#3AAFA9]/20"
          }`}
          style={{ fontSize: "16px", padding: "0 16px", fontWeight: "700" }}
        >
          {showForm ? (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              Close
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Add Record
            </>
          )}
        </button>
      </div>

      {showForm && (
        <div className="mb-8 animate-fade-in-down flex justify-center w-full">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-12 w-2/3 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-500 to-emerald-500"></div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <span className="p-2 rounded-lg bg-teal-500/10 text-teal-400"></span>
              Add New Record
            </h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1.5">
                    Title <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Blood Test Report"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500/50 focus:ring-1 focus:ring-teal-500/50 transition-colors"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Type <span className="text-red-400">*</span>
                  </label>
                  <select
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500/50 transition-colors appearance-none"
                    value={formData.record_type}
                    onChange={(e) =>
                      setFormData({ ...formData, record_type: e.target.value })
                    }
                  >
                    <option value="Report">Report</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Lab">Lab Result</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Date
                  </label>
                  <input
                    type="date"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 text-slate-900 dark:text-white focus:outline-none focus:border-teal-500/50 transition-colors"
                    value={formData.record_date}
                    onChange={(e) =>
                      setFormData({ ...formData, record_date: e.target.value })
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    Description
                  </label>
                  <textarea
                    placeholder="Add any relevant notes..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500/50 transition-colors h-40 resize-none"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-400 mb-1.5">
                    File Link (URL)
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/file.pdf"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-teal-500/50 transition-colors"
                    value={formData.file_url}
                    onChange={(e) =>
                      setFormData({ ...formData, file_url: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-200 dark:border-white/5">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors font-semibold"
                  style={{ fontSize: "16px", padding: "10px 20px" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="bg-[#3AAFA9] hover:bg-[#2d9d97] text-white rounded-xl shadow-lg shadow-[#3AAFA9]/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] font-bold"
                  style={{ fontSize: "16px", padding: "10px 24px" }}
                >
                  {createMutation.isPending ? "Saving..." : "Save Record"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 w-2/3">
        {records?.map((record) => (
          <div
            key={record.record_id}
            className="group bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 hover:bg-slate-50 dark:hover:bg-slate-800/80 hover:border-[#3AAFA9]/30 transition-all duration-300 relative shadow-sm"
          >
            <button
              onClick={() => deleteMutation.mutate(record.record_id)}
              className="absolute top-4 right-4 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 rounded-lg"
              title="Delete Record"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                {getIcon(record.record_type)}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">
                  {record.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 mb-2">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-700/50 text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                    {record.record_type}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    {new Date(record.record_date).toLocaleDateString()}
                  </span>
                </div>
                {record.description && (
                  <p className="text-slate-600 dark:text-slate-400 text-sm line-clamp-2 leading-relaxed">
                    {record.description}
                  </p>
                )}
                {record.file_url && (
                  <a
                    href={record.file_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-[#3AAFA9] hover:underline"
                  >
                    View Document
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
        {records?.length === 0 && !showForm && (
          <div className="col-span-full w-full mx-auto flex flex-col items-center justify-center p-12 text-center bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700/50 shadow-sm">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">No records found</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mb-6">
              Upload your medical reports, prescriptions, and lab results to keep them organized and accessible.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center justify-center gap-2 bg-[#3AAFA9] hover:bg-[#2d9d97] text-white rounded-xl shadow-lg shadow-[#3AAFA9]/20 transition-all transform hover:translate-y-[-1px]"
              style={{ fontSize: "16px", padding: "12px 20px", fontWeight: "700" }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
              Add your first record
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

