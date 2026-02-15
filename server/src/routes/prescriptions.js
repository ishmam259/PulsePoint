const express = require("express");
const router = express.Router();
const prescriptionController = require("../controllers/prescriptionController");

const auth = require("../middleware/auth"); // Assuming auth middleware exists and is needed

router.get("/", auth.authenticate, prescriptionController.getAllPrescriptions);
// router.get("/:id", prescriptionController.getPrescriptionById);
// router.get("/appointment/:appointment_id", prescriptionController.getPrescriptionByAppointment);
router.get(
  "/appointment/:appointment_id",
  prescriptionController.getPrescriptionByAppointment,
);
router.get(
  "/patient/:patientId",
  prescriptionController.getPrescriptionsByPatient,
);
router.post("/", auth.authenticate, prescriptionController.createPrescription);
router.put(
  "/:id",
  auth.authenticate,
  prescriptionController.updatePrescription,
);
router.delete(
  "/:id",
  auth.authenticate,
  prescriptionController.deletePrescription,
);

module.exports = router;
