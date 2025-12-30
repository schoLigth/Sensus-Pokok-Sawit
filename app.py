from flask import Flask, render_template, request, redirect, url_for, session, jsonify
import psycopg2
import urllib.parse
import os

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY")

# ====================================================
# DB URL — gunakan format yang sudah di-URL-ENCODE
# ====================================================
DB_URL = os.getenv("DB_URL")

def get_db_connection():
    return psycopg2.connect(DB_URL)

# ====================================================
# ROUTE LOGIN (GET)
# ====================================================
@app.route("/login", methods=["GET"])
def login():
    return render_template("login.html")

# ====================================================
# ROUTE LOGIN (POST)
# ====================================================
@app.route("/login", methods=["POST"])
def login_process():
    username = request.form.get("username")
    password = request.form.get("password")

    try:
        conn = get_db_connection()
        cur = conn.cursor()

        # Cocokkan dengan nama kolom dan nama tabel Supabase
        cur.execute("""
            SELECT user_name 
            FROM public.user
            WHERE user_name = %s AND password = %s
        """, (username, password))

        hasil = cur.fetchone()

        cur.close()
        conn.close()

        if hasil:
            # Berhasil login
            session["user"] = username
            return redirect(url_for("dashboard"))
        else:
            # Gagal login
            return render_template("login.html", error="Username atau password salah!")

    except Exception as e:
        print("LOGIN ERROR:", e)
        return render_template("login.html", error="Terjadi kesalahan koneksi database.")
    
# ======================
# DASHBOARD
# ======================
@app.route("/dashboard")
def dashboard():
    if "user" not in session:
        return redirect(url_for("login"))

    data = {
        "sehat": 120,
        "penyakit": 30,
        "hama": 25,
        "tercekik": 15,
        "mati": 8,
        "total": 198
    }

    return render_template("dashboard.html", data=data)


# ======================
# KUNJUNGAN BARU
# ======================
@app.route("/kunjungan-baru")
def kunjungan():
    if "user" not in session:
        return redirect(url_for("login"))

    return render_template("kunjungan.html")


# ======================
# SIMPAN KUNJUNGAN (INSERT)
# ======================
@app.route("/save_kunjungan", methods=["POST"])
def save_kunjungan():
    try:
        data = request.get_json()

        nama = data["nama"]
        status = data["status"]
        tanggal = data["tanggal"]
        waktu = data["waktu"]
        lokasi = data["lokasi"]
        blok = data["blok"]

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO kunjungan (user_name, status, date, time, location, block)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (nama, status, tanggal, waktu, lokasi, blok))

        conn.commit()
        cur.close()
        conn.close()

        return jsonify({"message": "success"}), 200
    
    except Exception as e:
        print("SAVE KUNJUNGAN ERROR:", e)
        return jsonify({"message": "error"}), 500


# ======================
# AMBIL KUNJUNGAN (SELECT)
# ======================
@app.route("/get_kunjungan")
def get_kunjungan():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT user_name, status, date, time, location, block
            FROM public.kunjungan
            ORDER BY id DESC
        """)

        rows = cur.fetchall()

        data = []
        for r in rows:
            data.append({
                "nama": r[0],
                "status": r[1],
                "tanggal": r[2],
                "waktu": r[3],
                "lokasi": r[4],
                "blok": r[5]
            })

        cur.close()
        conn.close()

        return jsonify(data)

    except Exception as e:
        print("SELECT ERROR:", e)
        return jsonify([])
    
@app.route("/maps")
def maps():
    if "user" not in session:
        return redirect(url_for("login"))

    return render_template("maps.html")


@app.route("/")
def home():
    return redirect(url_for("login"))

# ==========================
# RUN APP (HARUS PALING BAWAH)
# ==========================
if __name__ == "__main__":
    app.run(debug=True)