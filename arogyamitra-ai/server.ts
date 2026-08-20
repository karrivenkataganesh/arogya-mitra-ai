import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, Modality, LiveServerMessage } from '@google/genai';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  // Setup WebSocket Server for Live API voice conversations
  const wss = new WebSocketServer({ server, path: '/live' });

  // Middleware for parsing JSON & Base64 images (up to 20MB)
  app.use(express.json({ limit: '20mb' }));

  // Initialize Gemini AI client lazily/safely
  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set. Gemini API calls will fail.');
    }
    return new GoogleGenAI({
      apiKey: apiKey || '',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // Live API WebSocket Handler
  wss.on('connection', async (clientWs) => {
    console.log('Client connected to Live API WebSocket');
    let session: any = null;

    try {
      const ai = getGeminiClient();
      session = await ai.live.connect({
        model: 'gemini-3.1-flash-live-preview',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: 'You are ArogyaMitra AI, a compassionate and expert voice assistant for Primary Healthcare Centers (PHCs) and community health workers. Respond warmly, clearly, and concisely in simple spoken words. Assist with symptom triage prioritization, prescription clarification, first aid advice, and general health support. Always remind patients that you are an AI assistant and they should consult a doctor for diagnosis.',
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onmessage: (message: LiveServerMessage) => {
            const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audio && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'audio', audio }));
            }
            if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'interrupted' }));
            }

            // Extract transcriptions if available
            const modelPart = message.serverContent?.modelTurn?.parts?.[0];
            if (modelPart?.text && clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'outputTranscript', text: modelPart.text }));
            }
          },
          onclose: () => {
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'close' }));
            }
          },
          onerror: (err) => {
            console.error('Gemini Live API Session error:', err);
            if (clientWs.readyState === WebSocket.OPEN) {
              clientWs.send(JSON.stringify({ type: 'error', error: err.message || 'Live session error' }));
            }
          }
        }
      });

      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({ type: 'connected' }));
      }
    } catch (err: any) {
      console.error('Failed to establish Live API session:', err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(
          JSON.stringify({
            type: 'error',
            error: err.message || 'Failed to establish Gemini Live connection'
          })
        );
        clientWs.close();
      }
      return;
    }

    clientWs.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.audio) {
          session?.sendRealtimeInput({
            audio: { data: msg.audio, mimeType: 'audio/pcm;rate=16000' }
          });
        } else if (msg.text) {
          session?.sendRealtimeInput({
            text: msg.text
          });
        }
      } catch (e) {
        console.error('Error handling client message in WS:', e);
      }
    });

    clientWs.on('close', () => {
      try {
        session?.close();
      } catch (e) {
        // ignore
      }
    });
  });

  // 1. Health check route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'ArogyaMitra AI PHC Assistant' });
  });

  // 2. Triage API Endpoint
  app.post('/api/triage', async (req, res) => {
    try {
      const {
        symptoms,
        targetLanguage = 'Hindi',
        patientDemographics = {},
        vitals = {},
        audioBase64,
        mimeType = 'audio/webm'
      } = req.body;

      if (!symptoms && !audioBase64) {
        return res.status(400).json({ error: 'Symptoms text or audio recording is required.' });
      }

      const ai = getGeminiClient();

      const systemInstruction = `You are "ArogyaMitra AI", a medical triage assistant designed for Primary Healthcare Centers (PHCs) and Community Health Workers in rural and underserved areas across South Asia and APAC.

Role & Objective:
1. Analyze reported symptoms and vitals for patients in the requested language: "${targetLanguage}".
2. Classify urgency strictly according to standard 3-tier triage:
   - RED (Emergency): Immediate doctor intervention, potential transfer to district hospital (e.g. chest pain, severe dyspnea, heavy bleeding, snake bite, altered consciousness, severe burns).
   - YELLOW (Priority): Needs doctor consultation soon (e.g. high fever, severe vomiting/diarrhea without shock, acute localized pain, persistent cough with fever).
   - GREEN (Standard): Routine consultation or mild symptoms (e.g. mild cold, minor rash, localized mild pain, routine check).
3. Provide immediate non-diagnostic first aid / comfort measures while waiting for doctor.
4. Highlight critical red-flag escalation warnings.
5. All patient-facing titles, explanations, action plans, first aid, and warnings MUST be provided primarily in the requested target language ("${targetLanguage}") with clear simple words suitable for community health workers and patients.
6. MANDATORY SAFETY DISCLAIMER: State clearly that this is an AI organizational assistant helping with triage prioritization and NOT a licensed doctor replacing clinical judgment.`;

      const promptContent = `Patient Demographics:
Age: ${patientDemographics.age || 'Not specified'}
Gender: ${patientDemographics.gender || 'Not specified'}

Vital Signs Measured at PHC:
Temperature: ${vitals.temperature || 'Not recorded'}
Blood Pressure: ${vitals.bpSystolic && vitals.bpDiastolic ? `${vitals.bpSystolic}/${vitals.bpDiastolic} mmHg` : 'Not recorded'}
Pulse Rate: ${vitals.pulseRate || 'Not recorded'}
SpO2: ${vitals.spo2 || 'Not recorded'}
Respiratory Rate: ${vitals.respiratoryRate || 'Not recorded'}

Reported Symptoms:
"${symptoms || 'Audio recording provided below'}"

Target Language for Response: ${targetLanguage}

Provide structured output according to the JSON schema.`;

      const parts: any[] = [];
      if (audioBase64) {
        parts.push({
          inlineData: {
            mimeType: mimeType || 'audio/webm',
            data: audioBase64.replace(/^data:audio\/[a-z0-9]+;base64,/, '')
          }
        });
      }
      parts.push({ text: promptContent });

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: { parts },
        config: {
          systemInstruction,
          temperature: 0.2,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              urgencyLevel: {
                type: Type.STRING,
                description: 'Must be strictly "RED", "YELLOW", or "GREEN"'
              },
              urgencyTitle: {
                type: Type.STRING,
                description: `Short header title in ${targetLanguage} (e.g., "🚨 आपातकालीन - तुरंत डॉक्टर को दिखाएं")`
              },
              urgencyTitleEnglish: {
                type: Type.STRING,
                description: 'Short header title in English'
              },
              urgencyReasoning: {
                type: Type.STRING,
                description: `Detailed explanation of why this urgency level was selected, written in ${targetLanguage}`
              },
              actionPlan: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: `Immediate step-by-step action plan for PHC staff in ${targetLanguage}`
              },
              firstAidAdvice: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: `Safe non-diagnostic comfort and first-aid measures in ${targetLanguage}`
              },
              redFlagWarnings: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: `Escalation symptoms to watch out for in ${targetLanguage}`
              },
              recommendedSpecialist: {
                type: Type.STRING,
                description: 'Recommended specialist department (e.g. Cardiologist, General Physician, Pediatrician)'
              },
              translatedSymptoms: {
                type: Type.STRING,
                description: `Clear summary of the symptoms in ${targetLanguage}`
              },
              disclaimer: {
                type: Type.STRING,
                description: `Standard non-diagnostic AI safety notice in ${targetLanguage}`
              }
            },
            required: [
              'urgencyLevel',
              'urgencyTitle',
              'urgencyTitleEnglish',
              'urgencyReasoning',
              'actionPlan',
              'firstAidAdvice',
              'redFlagWarnings',
              'recommendedSpecialist',
              'translatedSymptoms',
              'disclaimer'
            ]
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response received from Gemini model.');
      }

      const result = JSON.parse(responseText);
      result.createdAt = new Date().toISOString();

      res.json({ success: true, result });
    } catch (error: any) {
      console.error('Triage Error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to process triage request.'
      });
    }
  });

  // 3. Prescription Interpreter / OCR API Endpoint
  app.post('/api/prescription/explain', async (req, res) => {
    try {
      const { imageBase64, audioBase64, dictatedText, mimeType = 'image/png', targetLanguage = 'Hindi' } = req.body;

      if (!imageBase64 && !audioBase64 && !dictatedText) {
        return res.status(400).json({ error: 'Prescription image, voice audio, or dictated text is required.' });
      }

      const ai = getGeminiClient();

      const systemInstruction = `You are "ArogyaMitra AI", a specialist medical prescription interpreter for Primary Healthcare Centers (PHCs) in rural South Asia and APAC.

Role & Instructions:
1. Examine the provided prescription photo, spoken voice audio, or dictated text doctor notes.
2. If the input is completely blurred, cut off, unreadable, or not a medical prescription note, set "is_readable: false" and specify "unreadableReason" clearly in ${targetLanguage}.
3. If readable:
   - Extract patient name and doctor name if mentioned or visible.
   - Summarize doctor's notes / suspected diagnosis.
   - For EACH medicine prescribed:
     * Extract exact raw text/dictation from note.
     * Identify standard generic or brand pharmaceutical name and dosage form (Tablet, Syrup, Capsule, Injection, Ointment, etc.).
     * Decode medical shorthand abbreviations (e.g., "OD" -> Once daily, "BD" -> Twice daily, "TDS" -> 3 times daily, "QDS" -> 4 times daily, "HS" -> At bedtime, "AC" -> Before meals, "PC" -> After meals, "1-0-1" -> Morning and Night, "1-1-1" -> Morning, Afternoon, Night, "SOS" -> Only when needed).
     * Provide simple, plain-language dosage instructions in "${targetLanguage}" (e.g. "नाश्ते के बाद 1 गोली, और रात के खाने के बाद 1 गोली").
     * Map dosage schedule to boolean flags:
       - morning (breakfast time)
       - afternoon (lunch time)
       - night (dinner / bed time)
       - timing: "BEFORE_MEAL" | "AFTER_MEAL" | "WITH_MEAL" | "AS_NEEDED" | "BEDTIME" | "ANYTIME"
     * Duration (e.g. "5 days", "1 month")
     * Purpose of medicine in simple terms (e.g. "For fever and severe pain")
     * Crucial safety warnings in ${targetLanguage} (e.g., "Do not crush", "Take with plenty of water", "Avoid alcohol", "May cause drowsiness").
   - Include general patient advice (e.g. rest, diet, fluid intake).
   - MANDATORY SAFETY DISCLAIMER: State clearly in ${targetLanguage} that this is an AI tool designed to clarify prescription instructions for better compliance, and patients must verify with their pharmacist or treating doctor.`;

      const parts: any[] = [];

      if (dictatedText) {
        parts.push({
          text: `Here is a spoken or dictated medical prescription note:\n\n"${dictatedText}"`
        });
      }

      if (audioBase64) {
        const cleanAudio = audioBase64.replace(/^data:audio\/[a-z0-9]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: mimeType || 'audio/webm',
            data: cleanAudio
          }
        });
      }

      if (imageBase64) {
        // Clean data URL prefix robustly (handling image/png, image/jpeg, image/svg+xml, etc.)
        const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

        let isSvg = (mimeType && mimeType.includes('svg')) || imageBase64.startsWith('data:image/svg+xml');
        let decodedText = '';
        try {
          decodedText = Buffer.from(cleanBase64, 'base64').toString('utf-8');
          if (decodedText.includes('<svg')) {
            isSvg = true;
          }
        } catch (e) {
          // Not text/svg
        }

        if (isSvg && decodedText) {
          parts.push({
            text: `Here is the prescription document in SVG vector format containing the doctor note:\n\n${decodedText}`
          });
        } else {
          parts.push({
            inlineData: {
              mimeType: (mimeType && !mimeType.includes('svg')) ? mimeType : 'image/png',
              data: cleanBase64
            }
          });
        }
      }

      parts.push({
        text: `Analyze this prescription note/dictation in detail and output structured JSON in target language: "${targetLanguage}".`
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: { parts },
        config: {
          systemInstruction,
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              is_readable: {
                type: Type.BOOLEAN,
                description: 'Set to false if blurred or unreadable image'
              },
              unreadableReason: {
                type: Type.STRING,
                description: `Reason why image is unreadable in ${targetLanguage}`
              },
              doctorNoteSummary: {
                type: Type.STRING,
                description: `Summary of doctor diagnosis or notes in ${targetLanguage}`
              },
              patientNameFromRx: { type: Type.STRING },
              doctorNameFromRx: { type: Type.STRING },
              medicines: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    rawText: { type: Type.STRING, description: 'Raw text extracted from image' },
                    medicineName: { type: Type.STRING, description: 'Generic / Brand name' },
                    dosageForm: { type: Type.STRING, description: 'Tablet, Syrup, Capsule, etc.' },
                    abbreviation: { type: Type.STRING, description: 'OD, BD, TDS, 1-0-1, etc.' },
                    abbreviationDecoded: { type: Type.STRING, description: 'Decoded meaning of abbreviation' },
                    simpleInstructions: { type: Type.STRING, description: `Plain dosage instructions in ${targetLanguage}` },
                    schedule: {
                      type: Type.OBJECT,
                      properties: {
                        morning: { type: Type.BOOLEAN },
                        afternoon: { type: Type.BOOLEAN },
                        night: { type: Type.BOOLEAN },
                        timing: { type: Type.STRING, description: 'BEFORE_MEAL | AFTER_MEAL | WITH_MEAL | AS_NEEDED | BEDTIME | ANYTIME' }
                      },
                      required: ['morning', 'afternoon', 'night', 'timing']
                    },
                    duration: { type: Type.STRING, description: 'e.g. 5 days' },
                    purpose: { type: Type.STRING, description: `Simple purpose in ${targetLanguage}` },
                    safetyWarnings: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                      description: `Crucial precautions in ${targetLanguage}`
                    }
                  },
                  required: [
                    'id',
                    'rawText',
                    'medicineName',
                    'dosageForm',
                    'abbreviation',
                    'abbreviationDecoded',
                    'simpleInstructions',
                    'schedule',
                    'duration',
                    'purpose',
                    'safetyWarnings'
                  ]
                }
              },
              generalAdvice: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: `General advice in ${targetLanguage}`
              },
              disclaimer: {
                type: Type.STRING,
                description: `Safety notice in ${targetLanguage}`
              }
            },
            required: ['is_readable', 'medicines', 'generalAdvice', 'disclaimer']
          }
        }
      });

      const responseText = response.text;
      if (!responseText) {
        throw new Error('Empty response received from Gemini model.');
      }

      const result = JSON.parse(responseText);
      result.createdAt = new Date().toISOString();

      res.json({ success: true, result });
    } catch (error: any) {
      console.error('Prescription Explanation Error:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to analyze prescription image.'
      });
    }
  });

  // Serve static files in production or Vite middleware in development
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`ArogyaMitra AI Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
