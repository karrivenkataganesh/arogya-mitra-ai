import os
import json
import base64
import io
import time
from datetime import datetime
import streamlit as st
import pandas as pd
from PIL import Image

# Page Configuration
st.set_page_config(
    page_title="ArogyaMitra AI - PHC Healthcare Assistant",
    page_icon="🏥",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Styling (Warm, dignified clinic aesthetic)
st.markdown("""
<style>
    /* Global styling */
    .stApp {
        background-color: #FDFBF7;
        font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif;
    }
    
    /* Header card */
    .hero-header {
        background: linear-gradient(135deg, #5A5A40 0%, #3F3F2C 100%);
        color: #FFFFFF;
        padding: 24px;
        border-radius: 16px;
        margin-bottom: 20px;
        box-shadow: 0 4px 12px rgba(90, 90, 64, 0.15);
    }
    
    .hero-header h1 {
        color: #FFFFFF !important;
        font-size: 26px;
        font-weight: 700;
        margin: 0;
    }
    
    .hero-header p {
        color: #E6E4DC !important;
        font-size: 14px;
        margin-top: 6px;
        margin-bottom: 0;
    }
    
    /* Status Badges */
    .badge-red {
        background-color: #FEE2E2;
        color: #991B1B;
        border: 1px solid #F87171;
        padding: 8px 16px;
        border-radius: 12px;
        font-weight: 700;
        font-size: 16px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }
    
    .badge-yellow {
        background-color: #FEF3C7;
        color: #92400E;
        border: 1px solid #FBBF24;
        padding: 8px 16px;
        border-radius: 12px;
        font-weight: 700;
        font-size: 16px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }
    
    .badge-green {
        background-color: #DCFCE7;
        color: #166534;
        border: 1px solid #4ADE80;
        padding: 8px 16px;
        border-radius: 12px;
        font-weight: 700;
        font-size: 16px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }
    
    /* Card Container */
    .phc-card {
        background-color: #FFFFFF;
        border: 1px solid rgba(90, 90, 64, 0.15);
        border-radius: 14px;
        padding: 18px;
        margin-bottom: 16px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    
    /* Timing Pills */
    .time-pill-active {
        background-color: #5A5A40;
        color: #FFFFFF;
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 12px;
        font-weight: 600;
        display: inline-block;
        margin-right: 4px;
    }
    
    .time-pill-inactive {
        background-color: #F1EFEA;
        color: #8C8F83;
        padding: 4px 10px;
        border-radius: 8px;
        font-size: 12px;
        display: inline-block;
        margin-right: 4px;
    }

    /* Print Slip */
    .print-slip {
        background-color: #FFFFFF;
        border: 2px dashed #5A5A40;
        border-radius: 12px;
        padding: 20px;
        font-family: monospace;
    }
</style>
""", unsafe_allow_html=True)

# ----------------- CONSTANTS & DATA -----------------
SUPPORTED_LANGUAGES = [
    {"code": "Hindi", "name": "Hindi (हिंदी)", "flag": "🇮🇳"},
    {"code": "English", "name": "English", "flag": "🇬🇧"},
    {"code": "Bengali", "name": "Bengali (বাংলা)", "flag": "🇮🇳"},
    {"code": "Tamil", "name": "Tamil (தமிழ்)", "flag": "🇮🇳"},
    {"code": "Telugu", "name": "Telugu (తెలుగు)", "flag": "🇮🇳"},
    {"code": "Marathi", "name": "Marathi (मराठी)", "flag": "🇮🇳"},
    {"code": "Gujarati", "name": "Gujarati (ગુજરાતી)", "flag": "🇮🇳"},
    {"code": "Kannada", "name": "Kannada (ಕನ್ನಡ)", "flag": "🇮🇳"},
    {"code": "Malayalam", "name": "Malayalam (മലയാളം)", "flag": "🇮🇳"},
    {"code": "Punjabi", "name": "Punjabi (ਪੰਜਾਬੀ)", "flag": "🇮🇳"},
    {"code": "Urdu", "name": "Urdu (اردو)", "flag": "🇵🇰"},
    {"code": "Nepali", "name": "Nepali (नेपाली)", "flag": "🇳🇵"},
    {"code": "Odia", "name": "Odia (ଓଡ଼ିଆ)", "flag": "🇮🇳"},
]

MEDICAL_ABBREVIATIONS = [
    {"abbr": "OD", "latin": "Omni Die", "english": "Once daily", "hindi": "दिन में 1 बार", "pattern": "1-0-0 or 0-0-1", "notes": "Maintenance drugs, vitamins"},
    {"abbr": "BD / BID", "latin": "Bis In Die", "english": "Twice a day", "hindi": "दिन में 2 बार (सुबह और रात)", "pattern": "1-0-1", "notes": "Antibiotics, pain relievers"},
    {"abbr": "TDS / TID", "latin": "Ter In Die", "english": "Three times a day", "hindi": "दिन में 3 बार (सुबह, दोपहर, रात)", "pattern": "1-1-1", "notes": "Antacids, antibiotics"},
    {"abbr": "QDS / QID", "latin": "Quater In Die", "english": "Four times a day", "hindi": "दिन में 4 बार (हर 6 घंटे में)", "pattern": "1-1-1-1", "notes": "Eye drops, severe infection syrups"},
    {"abbr": "HS", "latin": "Hora Somni", "english": "At bedtime", "hindi": "रात को सोने से ठीक पहले", "pattern": "0-0-1 (HS)", "notes": "Sleep aids, statins, anti-allergics"},
    {"abbr": "AC", "latin": "Ante Cibum", "english": "Before meals", "hindi": "खाना खाने से पहले (खाली पेट)", "pattern": "30 mins before food", "notes": "PPIs (Pantoprazole), Insulin"},
    {"abbr": "PC", "latin": "Post Cibum", "english": "After meals", "hindi": "खाना खाने के बाद", "pattern": "After meals", "notes": "Painkillers (NSAIDs), Metformin"},
    {"abbr": "SOS / PRN", "latin": "Si Opus Sit", "english": "As needed / Only in emergency", "hindi": "जरूरत पड़ने पर ही (जैसे तेज दर्द या बुखार में)", "pattern": "When required", "notes": "Paracetamol for high fever, Inhalers"},
    {"abbr": "STAT", "latin": "Statim", "english": "Immediately / Single emergency dose", "hindi": "तुरंत एक बार की आपात खुराक", "pattern": "Once now", "notes": "Emergency aspirin, anti-emetic"},
    {"abbr": "PO", "latin": "Per Os", "english": "By mouth / Oral route", "hindi": "मुंह द्वारा निगल कर लें", "pattern": "Oral intake", "notes": "Tablets, Syrups, Capsules"},
    {"abbr": "NPO", "latin": "Nil Per Os", "english": "Nothing by mouth", "hindi": "मुंह से कुछ भी न खाएं-पिएं", "pattern": "Fasting", "notes": "Before surgery or acute abdomen"},
    {"abbr": "1-0-1", "latin": "Latin abbreviation shorthand", "english": "Morning and Night", "hindi": "सुबह 1 और रात 1", "pattern": "Morning & Night", "notes": "Very common in Indian doctor notes"},
    {"abbr": "1-1-1", "latin": "Latin abbreviation shorthand", "english": "Morning, Afternoon and Night", "hindi": "सुबह, दोपहर और रात", "pattern": "TDS / 3 times", "notes": "Standard 8-hour dosing"},
    {"abbr": "1-0-0", "latin": "Latin abbreviation shorthand", "english": "Morning only", "hindi": "सिर्फ सुबह", "pattern": "OD Morning", "notes": "Thyroid, Antihypertensives"},
    {"abbr": "0-0-1", "latin": "Latin abbreviation shorthand", "english": "Night only", "hindi": "सिर्फ रात", "pattern": "OD Night", "notes": "Cetirizine, Montelukast"}
]

# Session State Initialization
if "triage_history" not in st.session_state:
    st.session_state.triage_history = []
if "prescription_history" not in st.session_state:
    st.session_state.prescription_history = []
if "last_triage_result" not in st.session_state:
    st.session_state.last_triage_result = None
if "last_prescription_result" not in st.session_state:
    st.session_state.last_prescription_result = None

# Helper: Get Gemini API Key
def get_api_key():
    # 1. Check Streamlit secrets
    if hasattr(st, "secrets") and "GEMINI_API_KEY" in st.secrets:
        return st.secrets["GEMINI_API_KEY"]
    # 2. Check environment variables
    env_key = os.getenv("GEMINI_API_KEY")
    if env_key:
        return env_key
    # 3. Check session state (user manual input in sidebar)
    return st.session_state.get("user_gemini_api_key", "")

# Helper: Call Gemini API using google-genai or google-generativeai
def call_gemini_json(prompt, system_instruction, image_bytes=None, mime_type="image/png", audio_bytes=None, audio_mime="audio/webm"):
    api_key = get_api_key()
    if not api_key:
        raise ValueError("Google Gemini API Key is not set. Please add GEMINI_API_KEY in .streamlit/secrets.toml or provide it in the sidebar.")
    
    # Try importing modern @google/genai SDK first
    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=api_key)
        
        contents = []
        if image_bytes:
            contents.append(types.Part.from_bytes(data=image_bytes, mime_type=mime_type))
        if audio_bytes:
            contents.append(types.Part.from_bytes(data=audio_bytes, mime_type=audio_mime))
        contents.append(prompt)
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.2,
                response_mime_type="application/json"
            )
        )
        return json.loads(response.text)
    except Exception as e:
        # Fallback to legacy google-generativeai if modern SDK fails
        try:
            import google.generativeai as legacy_genai
            legacy_genai.configure(api_key=api_key)
            model = legacy_genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=system_instruction,
                generation_config={"response_mime_type": "application/json", "temperature": 0.2}
            )
            
            parts = []
            if image_bytes:
                img = Image.open(io.BytesIO(image_bytes))
                parts.append(img)
            parts.append(prompt)
            
            resp = model.generate_content(parts)
            return json.loads(resp.text)
        except Exception as legacy_err:
            raise RuntimeError(f"Gemini API Error: {str(e)} | Fallback: {str(legacy_err)}")

# ----------------- SIDEBAR -----------------
with st.sidebar:
    st.image("https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&auto=format&fit=crop&q=80", use_container_width=True)
    st.title("🏥 ArogyaMitra AI")
    st.markdown("**PHC Healthcare & Triage Assistant**")
    
    # Language Selection
    lang_names = [l["name"] for l in SUPPORTED_LANGUAGES]
    selected_lang_name = st.selectbox("🌐 Select Target Language (भाषा चुनें)", lang_names, index=0)
    selected_lang_code = SUPPORTED_LANGUAGES[lang_names.index(selected_lang_name)]["code"]
    
    st.divider()
    
    # API Key Configuration
    current_key = get_api_key()
    if not current_key:
        st.warning("⚠️ No GEMINI_API_KEY detected in secrets.")
        user_key = st.text_input("Enter Google Gemini API Key:", type="password")
        if user_key:
            st.session_state["user_gemini_api_key"] = user_key
            st.success("API Key saved for current session!")
    else:
        st.success("✅ Gemini API Key connected")
        
    st.divider()
    st.markdown("""
    **PHC Emergency Protocols:**
    - 🚑 Ambulance: **108**
    - 🏥 National Health Helpline: **1075**
    - 🚨 Poison Control: **1800-116-117**
    """)
    st.caption("AI Organizational Support Tool • South Asia & APAC Rural PHCs")

# ----------------- MAIN HEADER -----------------
st.markdown(f"""
<div class="hero-header">
    <div style="display: flex; justify-content: space-between; align-items: center;">
        <div>
            <h1>आरोग्यमित्र • ArogyaMitra AI</h1>
            <p>Smart Medical Triage, Vitals Risk Stratification & Doctor Prescription Explainer</p>
        </div>
        <div style="text-align: right; background: rgba(255,255,255,0.15); padding: 8px 16px; border-radius: 10px;">
            <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #E6E4DC;">Current Mode</div>
            <div style="font-weight: 700; font-size: 14px; color: #FFFFFF;">PHC Clinic Active</div>
        </div>
    </div>
</div>
""", unsafe_allow_html=True)

# ----------------- MAIN TABS -----------------
tabs = st.tabs([
    "1. 🩺 Patient Triage & Vitals",
    "2. 📋 Prescription Explainer (OCR & Voice)",
    "3. 📖 Medical Abbreviation Guide",
    "4. 📁 PHC Records & Consultation Log",
    "5. 🎙️ Live Voice Guidance"
])

# ================= TAB 1: TRIAGE & VITALS =================
with tabs[0]:
    st.subheader("Patient Triage Prioritization & Vital Signs Assessment")
    st.markdown("Assess patient symptoms and clinical vitals to assign **RED (Emergency)**, **YELLOW (Priority)**, or **GREEN (Routine)** queues with step-by-step care pathways.")
    
    col_demo, col_vitals = st.columns([1, 1])
    
    with col_demo:
        st.markdown("##### 👤 Patient Demographics")
        pt_name = st.text_input("Patient Name (optional):", placeholder="e.g. Ramesh Kumar", key="triage_name")
        col_ag, col_gen = st.columns(2)
        with col_ag:
            pt_age = st.text_input("Age:", value="35", key="triage_age")
        with col_gen:
            pt_gender = st.selectbox("Gender:", ["Male", "Female", "Child", "Infant"], key="triage_gender")
            
        st.markdown("##### 📝 Reported Symptoms")
        
        # Preset symptom chips
        preset_choice = st.selectbox(
            "Load Quick Diagnostic Case Preset:",
            [
                "-- Select a sample PHC case --",
                "🚨 Severe Chest Pain radiating to jaw (Emergency Red)",
                "⚠️ 4-year Child High Fever 102.8°F & Vomiting (Priority Yellow)",
                "🟢 Mild Cold, Sore throat & Dry Cough (Routine Green)",
                "🚨 Snake bite with swelling & drowsiness (Emergency Red)"
            ]
        )
        
        default_symptom = ""
        if "Chest Pain" in preset_choice:
            default_symptom = "Patient experiencing severe crushing chest pain radiating to left arm and jaw for 30 minutes, cold clammy sweating, shortness of breath, dizziness."
        elif "High Fever" in preset_choice:
            default_symptom = "4-year-old child with 102.8°F fever for 2 days, persistent vomiting, lethargy, unable to drink fluids."
        elif "Mild Cold" in preset_choice:
            default_symptom = "Mild dry cough and runny nose for 3 days, mild headache, no breathlessness, eating normal food."
        elif "Snake bite" in preset_choice:
            default_symptom = "Farm worker bitten by snake on right ankle 20 minutes ago. Two puncture fang marks, rapid swelling, nausea, drowsiness."
            
        symptoms_text = st.text_area("Describe Symptoms / Chief Complaints:", value=default_symptom, height=100, placeholder="Type patient symptoms or use microphone...")
        
        # Audio Input for Voice Triage
        st.markdown("🎤 **Voice Dictation (Audio Input):**")
        audio_input = None
        if hasattr(st, "audio_input"):
            audio_input = st.audio_input("Record patient symptoms via microphone")
    
    with col_vitals:
        st.markdown("##### 🩺 Vital Signs Measured at PHC")
        col_v1, col_v2 = st.columns(2)
        with col_v1:
            v_temp = st.text_input("Body Temperature (°F):", value="98.6 °F")
            v_bp_sys = st.text_input("BP Systolic (mmHg):", value="120")
            v_pulse = st.text_input("Pulse Rate (bpm):", value="78 bpm")
        with col_v2:
            v_spo2 = st.text_input("SpO2 Blood Oxygen (%):", value="98%")
            v_bp_dia = st.text_input("BP Diastolic (mmHg):", value="80")
            v_resp = st.text_input("Respiratory Rate (/min):", value="16 /min")
            
        st.markdown("""
        <div style="background:#F5F2ED; padding:12px; border-radius:10px; font-size:12px; color:#5F6354; margin-top:10px;">
            <b>Normal Ranges:</b> Temp 97.8-99.1°F • BP 120/80 mmHg • Pulse 60-100 bpm • SpO2 >95% • Resp 12-20/min
        </div>
        """, unsafe_allow_html=True)
    
    btn_triage = st.button("🚀 Analyze Triage & Stratify Risk", type="primary", use_container_width=True)
    
    if btn_triage:
        if not symptoms_text and not audio_input:
            st.error("Please enter symptoms text or record audio.")
        else:
            with st.spinner(f"Evaluating symptoms with Gemini AI in {selected_lang_code}..."):
                try:
                    system_inst = f"""You are "ArogyaMitra AI", a medical triage assistant for Primary Healthcare Centers in South Asia & APAC.
1. Analyze symptoms and vitals in {selected_lang_code}.
2. Classify urgency strictly:
   - RED (Emergency): Immediate doctor intervention, district hospital referral.
   - YELLOW (Priority): Doctor consultation needed soon.
   - GREEN (Standard): Routine consultation or mild symptoms.
3. Provide step-by-step action plan, non-diagnostic first aid advice, and critical red flag warnings.
4. All explanations must be primarily in {selected_lang_code} with clear simple words for rural patients and PHC staff.
5. Provide a valid JSON response with keys: urgencyLevel (RED|YELLOW|GREEN), urgencyTitle, urgencyTitleEnglish, urgencyReasoning, actionPlan (array of strings), firstAidAdvice (array of strings), redFlagWarnings (array of strings), recommendedSpecialist, translatedSymptoms, disclaimer."""
                    
                    prompt = f"""Patient Demographics:
Age: {pt_age}
Gender: {pt_gender}
Name: {pt_name}

Vital Signs:
Temperature: {v_temp}
Blood Pressure: {v_bp_sys}/{v_bp_dia} mmHg
Pulse Rate: {v_pulse}
SpO2: {v_spo2}
Respiratory Rate: {v_resp}

Reported Symptoms:
"{symptoms_text}"

Target Language: {selected_lang_code}"""
                    
                    audio_bytes = audio_input.read() if audio_input else None
                    result = call_gemini_json(prompt, system_inst, audio_bytes=audio_bytes, audio_mime="audio/wav")
                    
                    result["patientName"] = pt_name or "Anonymous Patient"
                    result["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    st.session_state.last_triage_result = result
                    st.session_state.triage_history.append(result)
                    
                except Exception as err:
                    st.error(f"Triage Assessment Failed: {str(err)}")
    
    # Render Result
    if st.session_state.last_triage_result:
        res = st.session_state.last_triage_result
        st.divider()
        
        urgency = res.get("urgencyLevel", "GREEN").upper()
        badge_class = "badge-red" if urgency == "RED" else "badge-yellow" if urgency == "YELLOW" else "badge-green"
        icon = "🚨" if urgency == "RED" else "⚠️" if urgency == "YELLOW" else "🟢"
        
        st.markdown(f"""
        <div class="phc-card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span class="{badge_class}">{icon} {urgency} PRIORITY: {res.get('urgencyTitle', '')}</span>
                <span style="font-size:12px; color:#5F6354;">Assessed at: {res.get('timestamp', '')}</span>
            </div>
            <div style="font-size:16px; font-weight:600; color:#2D3025; margin-bottom:8px;">{res.get('urgencyTitleEnglish', '')}</div>
            <p style="font-size:14px; color:#404436; line-height:1.6;">{res.get('urgencyReasoning', '')}</p>
        </div>
        """, unsafe_allow_html=True)
        
        c1, c2, c3 = st.columns(3)
        with c1:
            st.markdown("#### 📋 Immediate Action Plan")
            for item in res.get("actionPlan", []):
                st.markdown(f"- **{item}**")
        with c2:
            st.markdown("#### 🩹 Safe First Aid & Comfort")
            for item in res.get("firstAidAdvice", []):
                st.markdown(f"- {item}")
        with c3:
            st.markdown("#### ⚠️ Red Flag Escalations")
            for item in res.get("redFlagWarnings", []):
                st.markdown(f"- 🔴 {item}")
                
        st.info(f"**Recommended Specialist:** {res.get('recommendedSpecialist', 'General Physician / Medical Officer')}")
        st.caption(f"🛡️ **Safety Disclaimer:** {res.get('disclaimer', '')}")

# ================= TAB 2: PRESCRIPTION EXPLAINER =================
with tabs[1]:
    st.subheader("Doctor Prescription Interpreter & Dosage Visualizer")
    st.markdown("Upload a doctor prescription photo, capture with camera, or speak medicine names to decode medical shorthand, dosages, and timings into clear local language instructions.")
    
    input_method = st.radio("Choose Input Method:", ["📸 Upload Prescription Photo", "📷 Capture with Camera", "🎙️ Spoken Prescription / Voice Dictation", "📄 Use Sample Handwritten Rx"], horizontal=True)
    
    rx_image_bytes = None
    rx_mime = "image/png"
    rx_dictated_text = ""
    rx_audio_bytes = None
    
    if input_method == "📸 Upload Prescription Photo":
        uploaded_file = st.file_uploader("Upload doctor prescription note (JPG, PNG, WEBP):", type=["jpg", "jpeg", "png", "webp"])
        if uploaded_file:
            rx_image_bytes = uploaded_file.read()
            rx_mime = uploaded_file.type
            st.image(rx_image_bytes, caption="Uploaded Prescription Note", width=380)
            
    elif input_method == "📷 Capture with Camera":
        cam_file = st.camera_input("Take photo of doctor prescription")
        if cam_file:
            rx_image_bytes = cam_file.read()
            rx_mime = "image/png"
            
    elif input_method == "🎙️ Spoken Prescription / Voice Dictation":
        st.markdown("Speak or dictate doctor prescription instructions aloud:")
        if hasattr(st, "audio_input"):
            rx_audio_input = st.audio_input("Record doctor's spoken prescription")
            if rx_audio_input:
                rx_audio_bytes = rx_audio_input.read()
        
        rx_dictated_text = st.text_area(
            "Or type / edit prescription notes:",
            value="Tab Paracetamol 650mg 1-0-1 TDS x 5 days after food, Cap Amoxicillin 500mg 1-1-1 x 5 days, Syrup Benadryl 5ml HS x 3 days",
            height=90
        )
        
    elif input_method == "📄 Use Sample Handwritten Rx":
        sample_opt = st.selectbox(
            "Select Sample Doctor Note:",
            [
                "1. Acute Bronchitis Rx (Amoxicillin + Paracetamol + Ambroxol)",
                "2. Type 2 Diabetes & Hypertension Rx (Metformin + Telmisartan + Atorvastatin)",
                "3. Pediatric Gastroenteritis Rx (ORS + Zinc + Cefixime)"
            ]
        )
        if "Bronchitis" in sample_opt:
            rx_dictated_text = "Dr. Rajesh Sharma, MD. Patient: Sunita Devi, 34F. Diagnosis: Acute Bronchitis. Rx: 1. Tab Augmentin 625mg 1-0-1 BD x 5 days PC. 2. Tab Paracetamol 650mg TDS SOS for fever. 3. Syrup Ascoril LS 10ml TDS x 5 days. Advice: Drink warm water, steam inhalation BD."
        elif "Diabetes" in sample_opt:
            rx_dictated_text = "Dr. Anita Roy. Patient: Harish Chandra, 58M. Diagnosis: T2DM & HTN. Rx: 1. Tab Metformin 500mg 1-0-1 BD before meals AC. 2. Tab Telmisartan 40mg 1-0-0 OD morning. 3. Tab Atorvastatin 10mg 0-0-1 HS bedtime x 30 days."
        else:
            rx_dictated_text = "Dr. Priya Verma, DCH. Patient: Master Aarav, 3M. Diagnosis: Acute Gastroenteritis. Rx: 1. ORS Sachet 1 pack in 1L boiled cooled water SOS after every loose stool. 2. Syrup Zinc 20mg 5ml OD x 14 days. 3. Syrup Cefixime 50mg 5ml BD x 5 days."
        st.info(f"Loaded note: {rx_dictated_text}")
    
    btn_explain_rx = st.button("✨ Decode Prescription & Generate Schedule", type="primary", use_container_width=True)
    
    if btn_explain_rx:
        if not rx_image_bytes and not rx_dictated_text and not rx_audio_bytes:
            st.error("Please provide a prescription image, audio recording, or text note.")
        else:
            with st.spinner(f"Decoding handwriting, abbreviations and generating dosage chart in {selected_lang_code}..."):
                try:
                    system_inst = f"""You are "ArogyaMitra AI", a specialist medical prescription interpreter for rural Primary Healthcare Centers in South Asia & APAC.
1. Decode doctor handwritten notes, spoken prescriptions, and abbreviations (OD, BD, TDS, QDS, HS, AC, PC, 1-0-1, SOS).
2. Extract patient name, doctor name, diagnosis, and each medicine item.
3. For EACH medicine, provide:
   - medicineName & dosageForm (Tablet, Syrup, Capsule, etc.)
   - abbreviation & abbreviationDecoded
   - simpleInstructions in {selected_lang_code} (e.g. "नाश्ते के बाद 1 गोली, और रात के खाने के बाद 1 गोली")
   - schedule: morning (boolean), afternoon (boolean), night (boolean), timing ("BEFORE_MEAL"|"AFTER_MEAL"|"WITH_MEAL"|"AS_NEEDED"|"BEDTIME"|"ANYTIME")
   - duration (e.g. "5 days")
   - purpose in simple words in {selected_lang_code}
   - safetyWarnings array in {selected_lang_code}
4. Provide general advice and safety disclaimer in {selected_lang_code}.
5. Return JSON with keys: is_readable, doctorNoteSummary, patientNameFromRx, doctorNameFromRx, medicines (array of medicine objects), generalAdvice (array of strings), disclaimer."""
                    
                    prompt = f"""Examine this medical prescription note and translate all patient instructions into {selected_lang_code}.
Dictated text (if any): "{rx_dictated_text}" """
                    
                    result = call_gemini_json(
                        prompt=prompt,
                        system_instruction=system_inst,
                        image_bytes=rx_image_bytes,
                        mime_type=rx_mime,
                        audio_bytes=rx_audio_bytes,
                        audio_mime="audio/wav"
                    )
                    
                    result["timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                    st.session_state.last_prescription_result = result
                    st.session_state.prescription_history.append(result)
                    
                except Exception as err:
                    st.error(f"Prescription Analysis Error: {str(err)}")
    
    # Render Prescription Result
    if st.session_state.last_prescription_result:
        res = st.session_state.last_prescription_result
        st.divider()
        
        st.markdown(f"""
        <div class="phc-card" style="border-left: 5px solid #5A5A40;">
            <div style="font-size:18px; font-weight:700; color:#2D3025;">📋 Doctor Prescription Summary</div>
            <div style="font-size:14px; color:#5F6354; margin-top:4px;">
                <b>Doctor:</b> {res.get('doctorNameFromRx', 'Treating Medical Officer')} • <b>Patient:</b> {res.get('patientNameFromRx', 'Patient')} • <b>Diagnosis:</b> {res.get('doctorNoteSummary', 'Prescribed Treatment')}
            </div>
        </div>
        """, unsafe_allow_html=True)
        
        st.markdown("### 💊 Medicine Dosage Schedule & Visual Guide")
        
        meds = res.get("medicines", [])
        if not meds:
            st.warning("No medicines could be parsed or image was unreadable.")
        else:
            for idx, med in enumerate(meds):
                sched = med.get("schedule", {})
                m_active = sched.get("morning", False)
                a_active = sched.get("afternoon", False)
                n_active = sched.get("night", False)
                timing = sched.get("timing", "AFTER_MEAL")
                
                timing_label = "🍽️ After Food (खाने के बाद)" if timing == "AFTER_MEAL" else "🥣 Before Food (खाली पेट)" if timing == "BEFORE_MEAL" else "🌙 At Bedtime (सोते समय)" if timing == "BEDTIME" else "⚡ As Needed (जरूरत पर)"
                
                st.markdown(f"""
                <div class="phc-card">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <div>
                            <span style="background:#5A5A40; color:#FFF; padding:2px 8px; border-radius:6px; font-size:11px; font-weight:700;">#{idx+1} {med.get('dosageForm', 'Medicine')}</span>
                            <span style="font-size:17px; font-weight:700; color:#2D3025; margin-left:8px;">{med.get('medicineName', 'Medicine')}</span>
                            <span style="font-size:12px; color:#5F6354; margin-left:6px;">({med.get('abbreviation', '')} • {med.get('abbreviationDecoded', '')})</span>
                        </div>
                        <div style="font-size:13px; font-weight:700; color:#5A5A40; background:#F5F2ED; padding:4px 10px; border-radius:8px;">
                            ⏳ Duration: {med.get('duration', 'As directed')}
                        </div>
                    </div>
                    
                    <div style="margin-top:12px; margin-bottom:10px;">
                        <span class="{'time-pill-active' if m_active else 'time-pill-inactive'}">☀️ Morning (सुबह)</span>
                        <span class="{'time-pill-active' if a_active else 'time-pill-inactive'}">🌤️ Afternoon (दोपहर)</span>
                        <span class="{'time-pill-active' if n_active else 'time-pill-inactive'}">🌙 Night (रात)</span>
                        <span style="background:#EFECE6; color:#2D3025; padding:4px 10px; border-radius:8px; font-size:12px; font-weight:600; margin-left:8px;">{timing_label}</span>
                    </div>
                    
                    <div style="background:#FDFBF7; border:1px solid #EFECE6; border-radius:10px; padding:10px; font-size:13px; color:#2D3025; margin-bottom:8px;">
                        <b>📢 Instructions ({selected_lang_code}):</b> {med.get('simpleInstructions', '')}
                    </div>
                    
                    <div style="font-size:12px; color:#5F6354;">
                        <b>Purpose:</b> {med.get('purpose', '')} • <b>Warnings:</b> {', '.join(med.get('safetyWarnings', ['Follow doctor advice']))}
                    </div>
                </div>
                """, unsafe_allow_html=True)
                
            # General Advice
            adv = res.get("generalAdvice", [])
            if adv:
                st.markdown("#### 💡 General Health Advice")
                for a in adv:
                    st.markdown(f"- {a}")
                    
            # Printable Bilingual Slip Download
            slip_text = f"""======================================================
AROGYAMITRA AI - PHC PATIENT DOSAGE SLIP
======================================================
Date: {res.get('timestamp', '')}
Patient: {res.get('patientNameFromRx', 'Patient')}
Doctor: {res.get('doctorNameFromRx', 'PHC Medical Officer')}
Diagnosis: {res.get('doctorNoteSummary', '')}
Language: {selected_lang_code}
------------------------------------------------------
MEDICINE SCHEDULE:
"""
            for i, m in enumerate(meds):
                slip_text += f"\n{i+1}. {m.get('medicineName')} ({m.get('dosageForm')})\n   - Shorthand: {m.get('abbreviation')}\n   - Timing: {m.get('simpleInstructions')}\n   - Duration: {m.get('duration')}\n   - Purpose: {m.get('purpose')}\n"
            slip_text += f"\nSAFETY NOTICE: Verify with PHC pharmacist before intake.\n======================================================"
            
            st.download_button("🖨️ Download Printable Patient Slip (TXT)", data=slip_text, file_name=f"Prescription_Slip_{int(time.time())}.txt", mime="text/plain")

# ================= TAB 3: MEDICAL ABBREVIATION GUIDE =================
with tabs[2]:
    st.subheader("Medical Shorthand & Abbreviation Glossary")
    st.markdown("Search standard prescription notations, Latin medical roots, daily timing patterns, and their translations.")
    
    search_q = st.text_input("🔍 Search abbreviations (e.g., 'OD', 'TDS', 'AC', 'खाना', 'night'):")
    
    filtered_abbr = MEDICAL_ABBREVIATIONS
    if search_q:
        q = search_q.lower()
        filtered_abbr = [
            a for a in MEDICAL_ABBREVIATIONS
            if q in a["abbr"].lower() or q in a["english"].lower() or q in a["hindi"].lower() or q in a["notes"].lower()
        ]
        
    df_abbr = pd.DataFrame(filtered_abbr)
    df_abbr.columns = ["Abbreviation", "Latin Term", "English Meaning", "Hindi Meaning (हिंदी)", "Dosage Pattern", "Clinical Context"]
    st.dataframe(df_abbr, use_container_width=True, hide_index=True)

# ================= TAB 4: PHC LOGS & HISTORY =================
with tabs[3]:
    st.subheader("📁 PHC Patient Consultation Logs")
    st.markdown("Review and export all patient triage evaluations and prescription breakdowns conducted in this active session.")
    
    col_t_hist, col_rx_hist = st.columns(2)
    
    with col_t_hist:
        st.markdown("#### 🩺 Triage Evaluations")
        if not st.session_state.triage_history:
            st.info("No triage evaluations recorded in this session yet.")
        else:
            for i, t in enumerate(reversed(st.session_state.triage_history)):
                st.markdown(f"""
                <div class="phc-card">
                    <b>{t.get('patientName', 'Patient')}</b> • <span style="font-weight:700; color:{'#991B1B' if t.get('urgencyLevel')=='RED' else '#92400E' if t.get('urgencyLevel')=='YELLOW' else '#166534'}">{t.get('urgencyLevel')}</span><br>
                    <small style="color:#5F6354;">{t.get('timestamp')}</small><br>
                    <p style="font-size:12px; margin-top:4px;">{t.get('urgencyTitleEnglish')}</p>
                </div>
                """, unsafe_allow_html=True)
                
            t_json = json.dumps(st.session_state.triage_history, indent=2)
            st.download_button("Export Triage Records (JSON)", data=t_json, file_name="PHC_Triage_Logs.json", mime="application/json")
            
    with col_rx_hist:
        st.markdown("#### 💊 Prescription Interpretations")
        if not st.session_state.prescription_history:
            st.info("No prescriptions analyzed in this session yet.")
        else:
            for i, r in enumerate(reversed(st.session_state.prescription_history)):
                med_count = len(r.get("medicines", []))
                st.markdown(f"""
                <div class="phc-card">
                    <b>Patient: {r.get('patientNameFromRx', 'Unknown')}</b> • {med_count} Medicines<br>
                    <small style="color:#5F6354;">{r.get('timestamp')}</small><br>
                    <p style="font-size:12px; margin-top:4px;">Doctor: {r.get('doctorNameFromRx', 'PHC Doctor')} | {r.get('doctorNoteSummary', '')}</p>
                </div>
                """, unsafe_allow_html=True)
                
            r_json = json.dumps(st.session_state.prescription_history, indent=2)
            st.download_button("Export Prescription Records (JSON)", data=r_json, file_name="PHC_Prescription_Logs.json", mime="application/json")
            
    if st.session_state.triage_history or st.session_state.prescription_history:
        if st.button("🗑️ Clear All Session Records"):
            st.session_state.triage_history = []
            st.session_state.prescription_history = []
            st.session_state.last_triage_result = None
            st.session_state.last_prescription_result = None
            st.rerun()

# ================= TAB 5: LIVE VOICE GUIDANCE =================
with tabs[4]:
    st.subheader("🎙️ Live Voice Guidance & Health Consultations")
    st.markdown("Use speech to ask questions about common ailments, first aid precautions, or vaccine schedules.")
    
    user_voice_query = st.text_input("Ask a clinical guidance question in any regional language:", placeholder="e.g. डेंगू के लक्षण क्या हैं और प्राथमिक उपचार क्या करें?")
    
    if st.button("🗣️ Get Voice & Text Guidance", type="primary"):
        if user_voice_query:
            with st.spinner("Consulting ArogyaMitra AI..."):
                try:
                    sys_inst = f"""You are ArogyaMitra AI, a compassionate healthcare voice assistant for rural PHCs in South Asia & APAC.
Answer the user's health query warmly, clearly, and concisely in {selected_lang_code}.
Include safe, non-diagnostic first aid advice, warnings for when to see a doctor immediately, and remind them that this is an AI assistant."""
                    
                    ans = call_gemini_json(
                        prompt=f"Question: {user_voice_query}\nProvide answer in JSON with keys: 'answer', 'keyPoints' (array of strings), 'emergencyWarning', 'spokenSummary'.",
                        system_instruction=sys_inst
                    )
                    
                    st.markdown(f"""
                    <div class="phc-card">
                        <h4>💬 Guidance in {selected_lang_code}</h4>
                        <p style="font-size:15px; line-height:1.6; color:#2D3025;">{ans.get('answer', '')}</p>
                        <div style="margin-top:10px;">
                            <b>Key Takeaways:</b>
                            <ul>
                    """, unsafe_allow_html=True)
                    for pt in ans.get("keyPoints", []):
                        st.markdown(f"- {pt}")
                    st.markdown(f"""
                            </ul>
                        </div>
                        <div style="background:#FEE2E2; border:1px solid #FCA5A5; color:#991B1B; padding:10px; border-radius:8px; font-size:13px; font-weight:600; margin-top:10px;">
                            🚨 Emergency Note: {ans.get('emergencyWarning', 'Visit PHC immediately if symptoms worsen.')}
                        </div>
                    </div>
                    """, unsafe_allow_html=True)
                except Exception as e:
                    st.error(f"Voice Assistant Error: {str(e)}")

# Footer
st.divider()
st.caption("ArogyaMitra AI • Primary Healthcare Center Assistant • Compliant with South Asia Rural PHC Guidelines")
