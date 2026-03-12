import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { hospitalsAPI, doctorsAPI } from "../services/api";

export default function StaffManagement() {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [staffSearch, setStaffSearch] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [consultationFee, setConsultationFee] = useState("");
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [editFee, setEditFee] = useState("");

  // Fetch hospital's doctors
  const { data: myDoctors, isLoading } = useQuery({
    queryKey: ["my-hospital-doctors"],
    queryFn: async () => (await hospitalsAPI.getMyDoctors()).data,
  });

  // Fetch all doctors for adding
  const { data: allDoctors } = useQuery({
    queryKey: ["all-doctors"],
    queryFn: async () => (await doctorsAPI.getAll()).data,
    enabled: showAddModal,
  });

  // Add doctor mutation
  const addDoctorMutation = useMutation({
    mutationFn: ({ doctorId, fee }) => hospitalsAPI.addDoctor(doctorId, fee),
    onSuccess: () => {
      queryClient.invalidateQueries(["my-hospital-doctors"]);
      setShowAddModal(false);
      setSelectedDoctor(null);
      setConsultationFee("");
    },
    onError: (err) => {
      alert(err.response?.data?.error || "Failed to add doctor");
    },
  });

  // Remove doctor mutation
  const removeDoctorMutation = useMutation({
    mutationFn: (doctorId) => hospitalsAPI.removeDoctor(doctorId),
    onSuccess: () => {
      queryClient.invalidateQueries(["my-hospital-doctors"]);
    },
    onError: (err) => {
      alert(err.response?.data?.error || "Failed to remove doctor");
    },
  });

  // Update fee mutation
  const updateFeeMutation = useMutation({
    mutationFn: ({ doctorId, fee }) =>
      hospitalsAPI.updateDoctorFee(doctorId, fee),
    onSuccess: () => {
      queryClient.invalidateQueries(["my-hospital-doctors"]);
      setEditingDoctor(null);
      setEditFee("");
    },
    onError: (err) => {
      alert(err.response?.data?.error || "Failed to update fee");
    },
  });

  // Filter doctors not already in hospital
  const availableDoctors =
    allDoctors?.filter(
      (d) => !myDoctors?.some((md) => md.user_id === d.user_id),
    ) || [];

  const filteredAvailableDoctors = availableDoctors.filter((d) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      d.full_name?.toLowerCase().includes(query) ||
      d.email?.toLowerCase().includes(query) ||
      d.specializations?.some((s) => s.toLowerCase().includes(query))
    );
  });

  const filteredMyDoctors = (myDoctors || []).filter((d) => {
    if (!staffSearch) return true;
    const query = staffSearch.toLowerCase();
    return (
      d.full_name?.toLowerCase().includes(query) ||
      d.email?.toLowerCase().includes(query) ||
      d.specializations?.some((s) => s.toLowerCase().includes(query))
    );
  });

  const handleAddDoctor = () => {
    if (!selectedDoctor) return;
    addDoctorMutation.mutate({
      doctorId: selectedDoctor.user_id,
      fee: parseFloat(consultationFee) || 500,
    });
  };

  const handleRemoveDoctor = (doctorId, doctorName) => {
    if (window.confirm(`Remove Dr. ${doctorName} from hospital?`)) {
      removeDoctorMutation.mutate(doctorId);
    }
  };

  const handleUpdateFee = (doctorId) => {
    if (!editFee) return;
    updateFeeMutation.mutate({
      doctorId,
      fee: parseFloat(editFee),
    });
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            Staff Management
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage doctors affiliated with your hospital
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex h-14 items-center gap-2 rounded-2xl bg-[#3AAFA9] px-6 text-base font-semibold text-white shadow-lg shadow-[#3AAFA9]/25 transition-colors hover:bg-[#2d9a94]"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Add Doctor
        </button>
      </div>

      {/* Doctors List */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-xl overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="inline-flex h-14 min-w-30 items-center rounded-2xl border border-slate-200/60 bg-white/80 px-5 text-sm font-medium text-slate-500 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-400">
            {filteredMyDoctors.length} doctors
          </div>
          <div className="relative w-full sm:w-80">
            <svg
              className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder=""
              value={staffSearch}
              onChange={(e) => setStaffSearch(e.target.value)}
              className="h-14 w-full rounded-2xl border border-slate-200/60 bg-white/80 pl-11 pr-4 text-sm text-slate-700 placeholder-slate-400 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-200"
            />
          </div>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3AAFA9]"></div>
          </div>
        ) : !myDoctors || myDoctors.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-slate-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              No doctors added yet
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              Click "Add Doctor" to affiliate doctors with your hospital
            </p>
          </div>
        ) : filteredMyDoctors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              No doctors match your search.
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              Try a different name or specialty.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200/50 dark:divide-slate-700/50">
            {filteredMyDoctors.map((doctor) => (
              <div
                key={doctor.user_id}
                className="p-5 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#3AAFA9] rounded-full flex items-center justify-center text-white text-lg font-bold">
                    {doctor.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">
                      Dr. {doctor.full_name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {doctor.specializations?.join(", ") || "General"}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {doctor.email} • {doctor.experience_years || 0} years exp
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  {/* Consultation Fee */}
                  {editingDoctor === doctor.user_id ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editFee}
                        onChange={(e) => setEditFee(e.target.value)}
                        className="w-24 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg text-sm"
                        placeholder="Fee"
                      />
                      <button
                        onClick={() => handleUpdateFee(doctor.user_id)}
                        disabled={updateFeeMutation.isPending}
                        className="text-emerald-500 hover:text-emerald-600 p-2"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => setEditingDoctor(null)}
                        className="text-slate-400 hover:text-slate-600 p-2"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
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
                  ) : (
                    <button
                      onClick={() => {
                        setEditingDoctor(doctor.user_id);
                        setEditFee(doctor.consultation_fee || "");
                      }}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors"
                    >
                      <span className="font-semibold">
                        ৳{doctor.consultation_fee || 0}
                      </span>
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                  )}

                  {/* Remove Button */}
                  <button
                    onClick={() =>
                      handleRemoveDoctor(doctor.user_id, doctor.full_name)
                    }
                    disabled={removeDoctorMutation.isPending}
                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-500/20 rounded-lg transition-colors"
                    title="Remove doctor"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Doctor Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  Add Doctor to Hospital
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedDoctor(null);
                    setSearchQuery("");
                  }}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-slate-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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

              {/* Search */}
              <div className="mt-4 relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search doctors by name or specialty..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-700 border-none rounded-lg text-slate-900 dark:text-white placeholder-slate-400"
                />
              </div>
            </div>

            {/* Doctor List */}
            <div className="max-h-64 overflow-y-auto">
              {filteredAvailableDoctors.length === 0 ? (
                <p className="text-center text-slate-500 py-8">
                  No available doctors found
                </p>
              ) : (
                filteredAvailableDoctors.map((doctor) => (
                  <button
                    key={doctor.user_id}
                    onClick={() => setSelectedDoctor(doctor)}
                    className={`w-full p-4 text-left flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${
                      selectedDoctor?.user_id === doctor.user_id
                        ? "bg-[#3AAFA9]/10 border-l-4 border-[#3AAFA9]"
                        : ""
                    }`}
                  >
                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-600 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 font-semibold">
                      {doctor.full_name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        Dr. {doctor.full_name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {doctor.specializations?.join(", ") || "General"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            {selectedDoctor && (
              <div className="p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Consultation Fee (৳)
                  </label>
                  <input
                    type="number"
                    value={consultationFee}
                    onChange={(e) => setConsultationFee(e.target.value)}
                    placeholder="500"
                    className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg"
                  />
                </div>
                <button
                  onClick={handleAddDoctor}
                  disabled={addDoctorMutation.isPending}
                  className="w-full bg-[#3AAFA9] hover:bg-[#2d9a94] text-white py-3 rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  {addDoctorMutation.isPending
                    ? "Adding..."
                    : `Add Dr. ${selectedDoctor.full_name}`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
