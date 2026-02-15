
import { useQuery } from "@tanstack/react-query";
import { prescriptionsAPI } from "../services/api";

export default function Prescriptions() {

  const storedUser = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();
  const doctorId = storedUser?.user_id;


  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ["prescriptions"],
    queryFn: async () => (await prescriptionsAPI.getAll()).data,
  });



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

      <div className="bg-white dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-2xl shadow-sm overflow-hidden backdrop-blur-xl p-6 min-h-[600px]">
        {!prescriptions || prescriptions.length === 0 ? (
          <div className="mt-10 text-center p-12 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400">No prescriptions found.</p>
          </div>
        ) : (
          <div className="grid gap-3 opacity-75">
            {prescriptions.map((prescription) => (
              <div
                key={prescription.prescription_id}
                className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between"
              >
                <div>
                  <h3 className="font-semibold text-slate-700 dark:text-slate-300">{prescription.medicine_name}</h3>
                  <p className="text-xs text-slate-500">
                    {prescription.dosage} • {prescription.duration_days} days
                  </p>
                </div>
                <div className="text-right text-xs text-slate-500">
                  <div className="font-medium text-slate-600 dark:text-slate-400">{prescription.patient_name}</div>
                  <div>Dr. {prescription.doctor_name}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
