# Deploying ArogyaMitra AI on Streamlit

This project is fully configured to be deployed on **Streamlit Community Cloud** (share.streamlit.io), **Hugging Face Spaces**, or any standard Python environment.

---

## 🚀 Option 1: Deploy on Streamlit Community Cloud (Recommended & Free)

1. **Push your repository to GitHub**:
   - Make sure `requirements.txt`, `streamlit_app.py`, and `.streamlit/config.toml` are in your repository root.

2. **Sign in to Streamlit Community Cloud**:
   - Go to [share.streamlit.io](https://share.streamlit.io/) and log in with your GitHub account.

3. **Create New App**:
   - Click **"New App"** (or **"Create App"**).
   - Select your GitHub repository, branch (e.g., `main`), and set **Main file path** to:
     ```
     streamlit_app.py
     ```

4. **Add your Gemini API Key in Streamlit Secrets**:
   - In App settings, navigate to **Secrets** (or click the Advanced Settings dropdown before deploying).
   - Paste the following:
     ```toml
     GEMINI_API_KEY = "your_actual_gemini_api_key_here"
     ```
   - Click **Deploy!**

---

## 💻 Option 2: Running Locally with Python & Streamlit

1. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set your Gemini API Key**:
   - On Linux/macOS:
     ```bash
     export GEMINI_API_KEY="your_api_key_here"
     ```
   - On Windows (Command Prompt):
     ```cmd
     set GEMINI_API_KEY=your_api_key_here
     ```
   - On Windows (PowerShell):
     ```powershell
     $env:GEMINI_API_KEY="your_api_key_here"
     ```
   - Or create `.streamlit/secrets.toml`:
     ```toml
     GEMINI_API_KEY = "your_api_key_here"
     ```

3. **Launch the Streamlit app**:
   ```bash
   streamlit run streamlit_app.py
   ```
   The application will start on `http://localhost:8501`.

---

## 📦 What's Included in the Streamlit App:
- **Patient Triage & Vitals Assessment**: 3-tier Red/Yellow/Green prioritization with vital sign monitoring and immediate first-aid advice.
- **Prescription Explainer (OCR & Voice)**: Image upload, camera capture, and voice dictation to decode doctor notes and abbreviations into clear dosage visualizers.
- **Medical Abbreviation Guide**: Searchable glossary of Latin and clinical abbreviations (OD, BD, TDS, QDS, AC, PC, HS, SOS, 1-0-1, etc.).
- **PHC Consultation Logs**: Session records with export to JSON/CSV.
- **Live Multilingual Voice Guidance**: Instant clinical health guidance across 13+ South Asian and regional languages.
