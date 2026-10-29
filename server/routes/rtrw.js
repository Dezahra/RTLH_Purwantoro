import { Router } from "express";
import { pool } from "../db.js";

const router = Router();

async function handleGetRtRw(req, res) {
  try {
    const [rows] = await pool.query(
      "SELECT id, kode, rw, rt, label FROM rt_rws ORDER BY CAST(rw AS UNSIGNED) ASC, CAST(rt AS UNSIGNED) ASC"
    );

    res.json({
      status: "success",
      success: true,
      data: rows
    });
  } catch (err) {
    console.error("Gagal mengambil RT/RW:", err);
    res.status(500).json({
      status: "error",
      success: false,
      message: "Gagal mengambil data RT/RW: " + err.message
    });
  }
}

router.get("/", handleGetRtRw);
router.get("/get_rtrw.php", handleGetRtRw);

export default router;
