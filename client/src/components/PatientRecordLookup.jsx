import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  patientsAPI,
  medicalHistoryAPI,
  prescriptionsAPI,
  appointmentsAPI,
} from "../services/api";

export default function PatientRecordLookup() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Fetch all patients
  const { data: patients, isLoading: patientsLoading } = useQuery({
    queryKey: ["all-patients"],
    queryFn: async () => (await patientsAPI.getAll()).data,
  });

  // Fetch selected patient's medical history
  const { data: medicalHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["patient-medical-history", selectedPatient?.user_id],
    queryFn: async () =>
      (await medicalHistoryAPI.getByPatient(selectedPatient.user_id)).data,
    enabled: !!selectedPatient?.user_id,
  });

  // Fetch selected patient's prescriptions
  const { data: prescriptions, isLoading: prescriptionsLoading } = useQuery({
    queryKey: ["patient-prescriptions", selectedPatient?.user_id],
    queryFn: async () =>
      (await prescriptionsAPI.getByPatient(selectedPatient.user_id)).data,
    enabled: !!selectedPatient?.user_id,
  });

  // Fetch selected patient's appointments
  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["patient-appointments", selectedPatient?.user_id],
    queryFn: async () =>
      (await appointmentsAPI.getByPatient(selectedPatient.user_id)).data,
    enabled: !!selectedPatient?.user_id,
  });

  // Filter patients by search query
  const filteredPatients =
    patients?.filter((p) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        p.full_name?.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query) ||
        p.phone?.toLowerCase().includes(query)
      );
    }) || [];

  const historyCount = medicalHistory?.length || 0;
  const prescriptionsCount = prescriptions?.length || 0;
  const appointmentsCount = appointments?.length || 0;
  const lastVisitDate = medicalHistory?.[0]?.visit_date
    ? new Date(medicalHistory[0].visit_date).toLocaleDateString()
    : null;

  return (
    <div className="animate-fade-in">
      {/* Search Bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
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
            placeholder="Search patients by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/70 dark:bg-slate-800/70 border border-slate-200/50 dark:border-slate-700/50 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#3AAFA9]/50 focus:border-[#3AAFA9] transition-all"
          />
        </div>
        {selectedPatient && (
          <button
            type="button"
            onClick={() => setSelectedPatient(null)}
            className="inline-flex items-center justify-center h-10 px-4 text-sm font-semibold rounded-xl border border-slate-200/70 dark:border-slate-700/60 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700/60 transition-colors"
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <div className="lg:col-span-1">
          <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-4 max-h-[600px] overflow-y-auto">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-4">
              Patients ({filteredPatients.length})
            </h3>

            {patientsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#3AAFA9]"></div>
              </div>
            ) : filteredPatients.length === 0 ? (
              <p className="text-center text-slate-400 dark:text-slate-500 py-8">
                No patients found
              </p>
            ) : (
              <div className="space-y-2">
                {filteredPatients.map((patient) => (
                  <button
                    key={patient.user_id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${selectedPatient?.user_id === patient.user_id
                        ? "bg-[#3AAFA9]/10 border-l-4 border-[#3AAFA9]"
                        : "hover:bg-slate-100/50 dark:hover:bg-slate-700/50"
                      }`}
                  >
                    <p className="font-medium text-slate-900 dark:text-white">
                      {patient.full_name}
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {patient.email}
                    </p>
                    {patient.phone && (
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                        {patient.phone}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Patient Details */}
        <div className="lg:col-span-2">
          {!selectedPatient ? (
            <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-12 text-center">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
              <p className="text-slate-500 dark:text-slate-400 text-lg">
                Select a patient to view their records
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Patient Info Card */}
              <div className="bg-gradient-to-br from-[#3AAFA9]/10 to-[#3AAFA9]/5 dark:from-[#3AAFA9]/20 dark:to-slate-800/50 backdrop-blur-md border border-[#3AAFA9]/20 dark:border-[#3AAFA9]/30 rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-[#3AAFA9] rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {selectedPatient.full_name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                      {selectedPatient.full_name}
                    </h2>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-600 dark:text-slate-300">
                      {selectedPatient.age_years && (
                        <span>{selectedPatient.age_years} years</span>
                      )}
                      {selectedPatient.gender && (
                        <span>{selectedPatient.gender}</span>
                      )}
                      {selectedPatient.email && (
                        <span>{selectedPatient.email}</span>
                      )}
                      {selectedPatient.phone && (
                        <span>{selectedPatient.phone}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "History", value: historyCount },
                  { label: "Prescriptions", value: prescriptionsCount },
                  { label: "Appointments", value: appointmentsCount },
                  { label: "Last Visit", value: lastVisitDate || "—" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-4"
                  >
                    <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                      {stat.label}
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Medical History */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  Medical History
                </h3>
                {historyLoading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                  </div>
                ) : !medicalHistory || medicalHistory.length === 0 ? (
                  <p className="text-slate-400 dark:text-slate-500">
                    No medical history records
                  </p>
                ) : (
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {medicalHistory.map((record) => (
                      <div
                        key={record.history_id}
                        className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg"
                      >
                        <div className="w-2 h-2 mt-2 bg-[#3AAFA9] rounded-full flex-shrink-0"></div>
                        <div>
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {record.diagnosis}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(record.visit_date).toLocaleDateString()} •
                            Dr. {record.doctor_name || "Unknown"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Prescriptions */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  Prescriptions
                </h3>
                {prescriptionsLoading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                  </div>
                ) : !prescriptions || prescriptions.length === 0 ? (
                  <p className="text-slate-400 dark:text-slate-500">
                    No prescriptions
                  </p>
                ) : (
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {prescriptions.map((rx) => (
                      <div
                        key={rx.prescription_id}
                        className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg"
                      >
                        <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {rx.medication_name ||
                              rx.medicines?.[0]?.name ||
                              "Prescription"}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {rx.created_at &&
                              new Date(rx.created_at).toLocaleDateString()}
                            {rx.doctor_name && ` • Dr. ${rx.doctor_name}`}
                          </p>
                        </div>
                        {rx.status && (
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${rx.status === "ongoing"
                                ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                : "bg-slate-100 dark:bg-slate-700 text-slate-500"
                              }`}
                          >
                            {rx.status}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Appointments */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200/50 dark:border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  Appointment History
                </h3>
                {appointmentsLoading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4"></div>
                    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
                  </div>
                ) : !appointments || appointments.length === 0 ? (
                  <p className="text-slate-400 dark:text-slate-500">
                    No appointments
                  </p>
                ) : (
                  <div className="space-y-3 max-h-48 overflow-y-auto">
                    {appointments.slice(0, 10).map((appt) => (
                      <div
                        key={appt.appointment_id}
                        className="flex gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg"
                      >
                        <div className="w-2 h-2 mt-2 bg-amber-500 rounded-full flex-shrink-0"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-900 dark:text-white">
                            {appt.appt_date &&
                              new Date(appt.appt_date).toLocaleDateString()}
                            {appt.appt_time &&
                              ` at ${String(appt.appt_time).substring(0, 5)}`}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {appt.doctor_name && `Dr. ${appt.doctor_name}`}
                            {appt.hospital_name && ` • ${appt.hospital_name}`}
                          </p>
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full capitalize ${appt.status === "completed"
                              ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                              : appt.status === "cancelled"
                                ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                                : "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                            }`}
                        >
                          {appt.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
