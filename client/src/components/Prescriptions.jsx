import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { prescriptionsAPI } from "../services/api";

function formatPrescriptionDuration(durationValue) {
  if (!durationValue) {
    return "No end date";
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(durationValue)) {
    return `Until ${new Date(`${durationValue}T00:00:00`).toLocaleDateString()}`;
  }

  return durationValue;
}

export default function Prescriptions() {
  const queryClient = useQueryClient();

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ["prescriptions"],
    queryFn: async () => (await prescriptionsAPI.getAll()).data,
  });

  const deleteMutation = useMutation({
    mutationFn: prescriptionsAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
    },
    onError: (error) => {
      alert(error.response?.data?.error || "Failed to delete prescription");
    },
  });

  const handleDelete = (prescriptionId) => {
    if (!window.confirm("Are you sure you want to delete this prescription?")) {
      return;
    }

    deleteMutation.mutate(prescriptionId);
  };

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading prescriptions...</p>
        </div>
      </div>
    );

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
            Prescriptions
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Manage medication prescriptions
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden backdrop-blur-xl p-6 min-h-150">
        {!prescriptions || prescriptions.length === 0 ? (
          <div className="mt-10 text-center p-12 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">
              No prescriptions found.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 opacity-75">
            {prescriptions.map((prescription) => (
              <div
                key={prescription.prescription_id}
                className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300">
                    {prescription.medicine_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {prescription.dosage} •{" "}
                    {formatPrescriptionDuration(prescription.duration_days)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleDelete(prescription.prescription_id)}
                    disabled={deleteMutation.isPending}
                    className="inline-flex items-center justify-center rounded-lg p-2 text-red-500 transition-colors hover:bg-red-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-red-500/20"
                    title="Delete prescription"
                  >
                    <svg
                      className="h-5 w-5"
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
                  <div className="text-right text-xs text-slate-500">
                    <div className="font-medium text-slate-600 dark:text-slate-400">
                      {prescription.patient_name}
                    </div>
                    <div>Dr. {prescription.doctor_name}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
