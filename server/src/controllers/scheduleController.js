const db = require("../config/database");

// Get doctor's schedule
exports.getDoctorSchedules = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const result = await db.query(
      `
      SELECT 
        ds.*,
        CASE 
          WHEN ds.facility_type = 'hospital' THEN h.name
          ELSE c.name
        END as facility_name,
        CASE 
          WHEN ds.facility_type = 'hospital' THEN 
             COALESCE(
               (
                 SELECT ba.address
                 FROM unnest(h.branch_names) WITH ORDINALITY AS bn(name, idx)
                 LEFT JOIN unnest(h.branch_addresses) WITH ORDINALITY AS ba(address, idx)
                   ON ba.idx = bn.idx
                 WHERE bn.name = ds.branch_name
                 LIMIT 1
               ), 
               ds.branch_name, -- Fallback to branch name if address not found
               h.location
             )
          ELSE c.location
        END as location
      FROM doctor_schedules ds
      LEFT JOIN hospitals h ON ds.facility_id = h.hospital_id AND ds.facility_type = 'hospital'
      LEFT JOIN chambers c ON ds.facility_id = c.chamber_id AND ds.facility_type = 'chamber'
      WHERE ds.doctor_id = $1 AND ds.is_active = TRUE
      ORDER BY 
        CASE 
          WHEN ds.schedule_type = 'single' THEN 0 
          ELSE 1 
        END,
        ds.specific_date,
        CASE ds.day_of_week
          WHEN 'Monday' THEN 1
          WHEN 'Tuesday' THEN 2
          WHEN 'Wednesday' THEN 3
          WHEN 'Thursday' THEN 4
          WHEN 'Friday' THEN 5
          WHEN 'Saturday' THEN 6
          WHEN 'Sunday' THEN 7
        END,
        ds.start_time
    `,
      [doctorId],
    );

    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create doctor schedule
exports.createDoctorSchedule = async (req, res) => {
  try {
    const {
      doctor_id,
      facility_id,
      facility_type,
      branch_name,
      schedule_type, // 'weekly' or 'single'
      specific_date, // required if schedule_type is 'single'
      day_of_week, // required if schedule_type is 'weekly'
      start_time,
      end_time,
      slot_duration_minutes,
    } = req.body;

    const doctorId = req.user?.userId ?? doctor_id;
    if (!doctorId) {
      return res.status(400).json({ error: "doctor_id is required" });
    }

    const type = schedule_type || "weekly";

    if (type === "single" && !specific_date) {
      return res
        .status(400)
        .json({ error: "Specific date is required for single schedule" });
    }

    if (type === "single") {
      const today = new Date();
      const checkDate = new Date(specific_date);
      // Compare YYYY-MM-DD strings to avoid timezone confusion, assuming input is YYYY-MM-DD
      const todayStr = today.toISOString().split("T")[0];
      if (specific_date <= todayStr) {
        return res
          .status(400)
          .json({ error: "Single schedule date must be in the future" });
      }
    }

    if (type === "weekly" && !day_of_week) {
      return res
        .status(400)
        .json({ error: "Day of week is required for weekly schedule" });
    }

    const result = await db.query(
      `
      INSERT INTO doctor_schedules (doctor_id, facility_id, facility_type, branch_name, schedule_type, specific_date, day_of_week, start_time, end_time, slot_duration_minutes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `,
      [
        doctorId,
        facility_id,
        facility_type,
        branch_name || null,
        type,
        type === "single" ? specific_date : null,
        type === "weekly" ? day_of_week : null,
        start_time,
        end_time,
        slot_duration_minutes || 30,
      ],
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get available slots for a doctor
exports.getAvailableSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { start_date, end_date, facility_type } = req.query;

    if (!start_date || !end_date) {
      return res
        .status(400)
        .json({ error: "start_date and end_date are required" });
    }

    const startDateObj = new Date(String(start_date));
    const endDateObj = new Date(String(end_date));
    if (
      Number.isNaN(startDateObj.getTime()) ||
      Number.isNaN(endDateObj.getTime())
    ) {
      return res.status(400).json({ error: "Invalid start_date or end_date" });
    }
    if (endDateObj < startDateObj) {
      return res
        .status(400)
        .json({ error: "end_date must be on/after start_date" });
    }
    const maxDays = 90;
    const diffDays = Math.ceil(
      (endDateObj - startDateObj) / (1000 * 60 * 60 * 24),
    );
    if (diffDays > maxDays) {
      return res
        .status(400)
        .json({ error: `Date range too large (max ${maxDays} days)` });
    }

    // Ensure slots exist for the requested range.
    // This is idempotent because the DB function uses ON CONFLICT DO NOTHING.
    await db.query(
      `
      SELECT generate_slots_for_schedule(ds.schedule_id, $2, $3)
      FROM doctor_schedules ds
      WHERE ds.doctor_id = $1 AND ds.is_active = TRUE
    `,
      [doctorId, start_date, end_date],
    );

    let query = `
      SELECT 
        s.*,
        CASE 
          WHEN s.facility_type = 'hospital' THEN h.name
          ELSE c.name
        END as facility_name,
        CASE 
          WHEN s.facility_type = 'hospital' THEN 
             COALESCE(
               (
                 SELECT ba.address
                 FROM unnest(h.branch_names) WITH ORDINALITY AS bn(name, idx)
                 LEFT JOIN unnest(h.branch_addresses) WITH ORDINALITY AS ba(address, idx)
                   ON ba.idx = bn.idx
                 WHERE bn.name = s.branch_name
                 LIMIT 1
               ), 
               s.branch_name,
               h.location
             )
          ELSE c.location
        END as location
      FROM appointment_slots s
      LEFT JOIN hospitals h ON s.facility_id = h.hospital_id AND s.facility_type = 'hospital'
      LEFT JOIN chambers c ON s.facility_id = c.chamber_id AND s.facility_type = 'chamber'
      WHERE s.doctor_id = $1
        AND s.slot_date >= $2
        AND s.slot_date <= $3
    `;

    const params = [doctorId, start_date, end_date];

    if (facility_type) {
      query += ` AND s.facility_type = $4`;
      params.push(facility_type);
    }

    query += ` ORDER BY s.slot_date, s.slot_time`;

    const result = await db.query(query, params);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Generate slots for a schedule (Unchanged from prev logic, just keeps the file complete)
exports.generateSlots = async (req, res) => {
  try {
    const { schedule_id, start_date, end_date } = req.body;

    const doctorId = req.user?.userId;
    if (doctorId) {
      const owned = await db.query(
        "SELECT 1 FROM doctor_schedules WHERE schedule_id = $1 AND doctor_id = $2",
        [schedule_id, doctorId],
      );
      if (owned.rows.length === 0) {
        return res.status(403).json({
          error: "You can only generate slots for your own schedules",
        });
      }
    }

    await db.query(`SELECT generate_slots_for_schedule($1, $2, $3)`, [
      schedule_id,
      start_date,
      end_date,
    ]);

    res.json({ message: "Slots generated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Book a slot
exports.bookSlot = async (req, res) => {
  const client = await db.connect();

  function formatFriendlyDate(value) {
    if (!value) return "";

    // Prefer YYYY-MM-DD if present to avoid timezone shifts.
    const raw = String(value);
    const isoPrefix = raw.match(/^\d{4}-\d{2}-\d{2}/);
    let dateObj;
    if (isoPrefix) {
      const [y, m, d] = isoPrefix[0].split("-").map((n) => parseInt(n, 10));
      dateObj = new Date(y, m - 1, d);
    } else if (value instanceof Date) {
      dateObj = value;
    } else {
      const parsed = new Date(raw);
      dateObj = Number.isNaN(parsed.getTime()) ? null : parsed;
    }

    if (!dateObj) return raw;

    const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
      dateObj.getDay()
    ];
    const month = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
      "Dec", // Duplicate Dec? Assuming 12 months.
    ][dateObj.getMonth()];
    const day = String(dateObj.getDate()).padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${weekday}, ${day} ${month} ${year}`;
  }

  function formatTimeOnly(value) {
    if (!value) return "";
    const str = String(value);
    const match = str.match(/^(\d{1,2}):(\d{2})/);
    if (!match) return str;
    return `${match[1].padStart(2, "0")}:${match[2]}`;
  }
  try {
    await client.query("BEGIN");

    const { slot_id, triage_notes, payment_method, mfs_transaction_id } =
      req.body;
    const patientUserId = req.user?.userId;

    if (!patientUserId) {
      await client.query("ROLLBACK");
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!slot_id) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "slot_id is required" });
    }

    // Check if slot is still free
    const slotCheck = await client.query(
      `SELECT s.*, 
              CASE WHEN s.facility_type = 'hospital' THEN h.name ELSE c.name END as facility_name,
              CASE 
                WHEN s.facility_type = 'hospital' THEN 
                   COALESCE(
                     (SELECT ba.address
                      FROM unnest(h.branch_names) WITH ORDINALITY AS bn(name, idx)
                      LEFT JOIN unnest(h.branch_addresses) WITH ORDINALITY AS ba(address, idx)
                        ON ba.idx = bn.idx
                      WHERE bn.name = s.branch_name
                      LIMIT 1),
                     h.location
                   )
                ELSE c.address
              END as facility_address
       FROM appointment_slots s
       LEFT JOIN hospitals h ON s.facility_id = h.hospital_id AND s.facility_type = 'hospital'
       LEFT JOIN chambers c ON s.facility_id = c.chamber_id AND s.facility_type = 'chamber'
       WHERE s.slot_id = $1 AND s.status = 'free' FOR UPDATE OF s`,
      [slot_id],
    );

    if (slotCheck.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Slot is no longer available" });
    }

    const slot = slotCheck.rows[0];

    const doctorUserId = slot.doctor_id;

    // Get Doctor Fee
    const doctorCheck = await client.query(
      "SELECT consultation_fee, full_name, email FROM doctors d JOIN users u ON d.user_id = u.user_id WHERE d.user_id = $1",
      [doctorUserId],
    );
    const doctor = doctorCheck.rows[0];
    const fee = doctor.consultation_fee || 0;

    console.log(
      "[DEBUG bookSlot] Doctor:",
      doctor.full_name,
      "Fee from DB:",
      doctor.consultation_fee,
      "Fee used:",
      fee,
      "Branch:",
      slot.branch_name,
    );

    // Create appointment
    const appointmentResult = await client.query(
      `
      INSERT INTO appointments (patient_id, doctor_id, hospital_id, chamber_id, branch_name, appt_date, appt_time, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
      RETURNING *
    `,
      [
        patientUserId,
        doctorUserId,
        slot.facility_type === "hospital" ? slot.facility_id : null,
        slot.facility_type === "chamber" ? slot.facility_id : null,
        slot.branch_name || null,
        slot.slot_date,
        slot.slot_time,
      ],
    );

    const appointment = appointmentResult.rows[0];

    // Handle payment at booking time.
    const method = (payment_method || "wallet").toLowerCase();
    const hospitalFee =
      slot.facility_type === "hospital" ? Number(fee || 0) * 0.1 : 0;
    const totalFee = Number(fee || 0) + hospitalFee;

    const ensureUserAccount = async (userId) => {
      const existing = await client.query(
        "SELECT account_id FROM accounts WHERE owner_type = 'user' AND owner_id = $1",
        [userId],
      );
      if (existing.rows.length > 0) return existing.rows[0].account_id;

      const created = await client.query(
        "INSERT INTO accounts (owner_type, owner_id) VALUES ('user', $1) ON CONFLICT (owner_type, owner_id) DO NOTHING RETURNING account_id",
        [userId],
      );
      if (created.rows.length > 0) return created.rows[0].account_id;

      const after = await client.query(
        "SELECT account_id FROM accounts WHERE owner_type = 'user' AND owner_id = $1",
        [userId],
      );
      return after.rows[0]?.account_id;
    };

    const ensureHospitalAccount = async (hospitalId) => {
      if (!hospitalId) return null;
      const existing = await client.query(
        "SELECT account_id FROM accounts WHERE owner_type = 'hospital' AND owner_id = $1",
        [hospitalId],
      );
      if (existing.rows.length > 0) return existing.rows[0].account_id;

      const created = await client.query(
        "INSERT INTO accounts (owner_type, owner_id) VALUES ('hospital', $1) ON CONFLICT (owner_type, owner_id) DO NOTHING RETURNING account_id",
        [hospitalId],
      );
      if (created.rows.length > 0) return created.rows[0].account_id;

      const after = await client.query(
        "SELECT account_id FROM accounts WHERE owner_type = 'hospital' AND owner_id = $1",
        [hospitalId],
      );
      return after.rows[0]?.account_id;
    };

    if (totalFee > 0 && method === "mfs") {
      const { processDeposit } = require("./paymentController");
      try {
        const txnId = mfs_transaction_id ? String(mfs_transaction_id) : "";
        await processDeposit(patientUserId, totalFee, null, null, client, {
          description: `MFS top-up for appointment ${appointment.appointment_id}${txnId ? ` (${txnId})` : ""}`,
        });
      } catch (err) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "MFS top-up failed: " + err.message });
      }
    } else if (totalFee > 0 && method !== "wallet") {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Invalid payment_method" });
    }

    if (totalFee > 0) {
      const patientAccountId = await ensureUserAccount(patientUserId);
      const doctorAccountId = await ensureUserAccount(doctorUserId);

      if (!patientAccountId || !doctorAccountId) {
        await client.query("ROLLBACK");
        return res.status(400).json({ error: "Missing account for payment" });
      }

      try {
        const insertCompletedTxnOnce = async (
          fromAccountId,
          toAccountId,
          amount,
          description,
        ) => {
          const exists = await client.query(
            `SELECT 1
             FROM account_transactions
             WHERE status = 'completed'
               AND from_account_id = $1
               AND to_account_id = $2
               AND amount = $3
               AND COALESCE(description, '') = $4
             LIMIT 1`,
            [fromAccountId, toAccountId, amount, description],
          );

          if (exists.rows.length > 0) return;

          await client.query(
            `INSERT INTO account_transactions
             (from_account_id, to_account_id, amount, status, description)
             VALUES ($1, $2, $3, 'completed', $4)`,
            [fromAccountId, toAccountId, amount, description],
          );
        };

        await insertCompletedTxnOnce(
          patientAccountId,
          doctorAccountId,
          fee,
          `Doctor fee for appointment ${appointment.appointment_id}`,
        );

        if (hospitalFee > 0) {
          const hospitalAccountId = await ensureHospitalAccount(
            slot.facility_id,
          );
          if (!hospitalAccountId) {
            await client.query("ROLLBACK");
            return res.status(400).json({ error: "Missing hospital account" });
          }

          await insertCompletedTxnOnce(
            patientAccountId,
            hospitalAccountId,
            hospitalFee,
            `Hospital fee (10%) for appointment ${appointment.appointment_id}`,
          );
        }
      } catch (err) {
        await client.query("ROLLBACK");
        return res
          .status(400)
          .json({ error: "Payment failed: " + err.message });
      }
    }

    // Update slot status
    await client.query(
      `UPDATE appointment_slots SET status = 'booked', appointment_id = $1 WHERE slot_id = $2`,
      [appointment.appointment_id, slot_id],
    );

    // Add triage notes if provided
    if (triage_notes && triage_notes.symptoms) {
      await client.query(
        `
        INSERT INTO triage_notes (appointment_id, patient_id, symptoms, severity, notes)
        VALUES ($1, $2, $3, $4, $5)
      `,
        [
          appointment.appointment_id,
          patientUserId,
          triage_notes.symptoms,
          triage_notes.severity || "low",
          triage_notes.notes || "",
        ],
      );
    }

    await client.query("COMMIT");

    // Email Notification (After Commit)
    try {
      const { sendAppointmentEmail } = require("../services/emailService");

      // Fetch patient details for email
      const patientRes = await db.query(
        "SELECT full_name FROM users WHERE user_id = $1",
        [patientUserId],
      );
      const patientName = patientRes.rows[0]?.full_name || "Patient";

      const apptDate = formatFriendlyDate(slot.slot_date);
      const apptTime = formatTimeOnly(slot.slot_time);

      const subject = `New Appointment: ${apptDate} at ${apptTime}`;
      const text = `Hello Dr. ${doctor.full_name},
        
New appointment confirmed!
Patient: ${patientName}
Time: ${apptDate} at ${apptTime}
Location: ${slot.facility_name || "Clinic"} ${slot.branch_name ? `(${slot.branch_name})` : ""}
Address: ${slot.facility_address || "N/A"}
Fee: ${fee} BDT (${method})

Please log in to your dashboard for more details.`;

      await sendAppointmentEmail({
        to: doctor.email,
        subject,
        text,
      });
    } catch (e) {
      console.error("Email failed", e);
      // Don't fail the request if email fails
    }

    res.status(201).json(appointment);
  } catch (error) {
    await client.query("ROLLBACK");
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

// Block/unblock a slot
exports.updateSlotStatus = async (req, res) => {
  try {
    const { slot_id } = req.params;
    const { status } = req.body;

    const doctorId = req.user?.userId;
    if (doctorId) {
      const owned = await db.query(
        "SELECT 1 FROM appointment_slots WHERE slot_id = $1 AND doctor_id = $2",
        [slot_id, doctorId],
      );
      if (owned.rows.length === 0) {
        return res
          .status(403)
          .json({ error: "You can only modify your own slots" });
      }
    }

    const result = await db.query(
      `UPDATE appointment_slots SET status = $1 WHERE slot_id = $2 RETURNING *`,
      [status, slot_id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Slot not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
