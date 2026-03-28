# NeuroStep — Proposal Document

## AI-Powered Early Autism Screening Through Interactive Cognitive Games

**Author:** Gajula Krishna Koushik
**Institution:** GITAM University, Department of Computer Science and Engineering
**Contact:** KGAJULA2@GITAM.IN

---

## 1. The Problem We're Trying to Solve

A child with autism can show signs before they turn two. But most families don't get a diagnosis until the child is four or five — sometimes later. By then, the years when therapy works best have already slipped by.

Why does it take so long? The usual options aren't great. Parent questionnaires ask caregivers to recall behaviors from memory, which isn't always reliable. Clinical evaluations need a trained specialist, and in many places, the waitlist stretches six months to a year. In rural areas and smaller towns, there may not be a specialist at all.

That's the gap we wanted to address. Not every family can get to a clinic — but almost every family has access to a laptop with a camera.

---

## 2. What NeuroStep Does

NeuroStep is a simple browser-based tool. A child plays seven short, fun games on a laptop — things like popping bubbles, copying facial expressions, tapping on toys, or arranging daily routines in order. Each game takes about two minutes.

While the child plays, the system quietly watches how they behave — where they look, how fast they react, whether they repeat the same action over and over, how they respond when their name is called. It uses the laptop's webcam for this, and everything runs right in the browser. No data gets uploaded anywhere.

At the end, all of this information gets fed into an AI model that produces a single risk score. If the score is high, it suggests the family should talk to a specialist. NeuroStep doesn't diagnose anything — it just helps families know sooner if there's something worth looking into.

---

## 3. The Seven Games

| Game | What We're Looking For |
|---|---|
| Color Focus Bubble Pop | Can the child focus and avoid tapping the wrong color? |
| Routine Sequencer | Can they put daily activities in the right order? |
| Emotion Mirror | Can they recognize and copy facial expressions? |
| Object Hunt | Can they tell similar-looking objects apart? |
| Free Toy Tap | Do they explore different toys, or get stuck on one? |
| Shape Switch | Can they adapt when the rules suddenly change? |
| Attention Call | Do they look up when their name is called? |

Each game is designed around a real clinical screening question from the AQ-10 — but turned into something a child would actually want to do.

---

## 4. How the AI Works Behind the Scenes

We didn't rely on just one model. Each game has its own small classifier that looks at the behavior from that specific activity. Four of these are trained machine learning models (Random Forest and Logistic Regression), and three use straightforward rules based on what doctors already know works — like how often a child switches between toys or whether they respond to their name.

All seven scores then go into a second-level model that weighs them together — along with basic information like the child's age — and produces one final risk score. This layered approach gave us 91.85% accuracy on our test data, which is well above what any single game could manage on its own.

For the camera-based tracking, we use MediaPipe Face Mesh (for gaze and head movement) and face-api.js (for blink detection and expressions). Both run entirely on the user's device. No video is stored or sent anywhere.

After the screening, Google Gemini takes the results and writes a short, clear summary in plain language — something a parent or caregiver can actually read and understand without needing a medical background.

---

## 5. Technology Stack

| Layer | What We Used |
|---|---|
| Frontend | React 19, Vite 7, Tailwind CSS v4, Framer Motion |
| Backend | Firebase (Auth, Firestore, Analytics) |
| AI/ML | TensorFlow.js, MediaPipe, face-api.js, scikit-learn, Google Gemini |
| Database | Cloud Firestore |
| Hosting | Firebase Hosting (works as a Progressive Web App) |

---

## 6. What Makes This Different

Most existing screening tools either hand parents a questionnaire or require expensive lab equipment. NeuroStep sits in between — it observes the child directly, but through everyday technology.

A few things set it apart:
- It tests seven different behavioral areas in one sitting, not just one
- It runs entirely in the browser — no app to install, no server processing
- It works with just a laptop webcam — no eye-trackers or clinic visits
- All processing happens on the device, so nothing gets uploaded
- It uses games instead of forms, so children stay engaged naturally
- The results come in plain language, not numbers and charts

---

## 7. Fairness and Explainability

We were careful about this. The AI scores children based on what they actually do during the games — their taps, their gaze, their reactions — not on who they are. The model confirms it: gender barely affects the score (0.16 out of a possible range), and family history contributes even less. The risk score reflects behavior, not background.

The games are also visual and interaction-based, which means language and cultural differences don't interfere the way they do with written questionnaires.

And instead of handing caregivers a number, NeuroStep explains what it found — game by game. Something like "your child had trouble responding when called by name and tended to repeat the same action during free play." That's something a parent or Anganwadi worker can understand and act on.

---

## 8. The Impact We're Hoping For

If a child shows early signs and a family catches it at age two or three instead of five, the difference is real. Studies show that early therapy can improve IQ by 15–20 points and significantly strengthen communication and social skills. But that only works if the signs are spotted early enough.

NeuroStep makes that first step accessible — any family with a laptop and internet can screen their child at home in about 15 minutes. For communities where specialists are hours away, this could be the thing that gets a child into therapy years earlier than they otherwise would.

---

## 9. What We Still Need to Do

We're honest about the limitations. The model was trained on questionnaire data, not on recordings from real game sessions. Three of the seven games still use hand-tuned rules instead of learned models. And nobody has yet compared NeuroStep's output side by side with a gold-standard ADOS-2 evaluation by a licensed clinician.

The most important next step is a clinical validation trial — putting NeuroStep in front of real children and comparing the results with professional assessments. That's what would move this from a promising prototype to something a doctor could actually recommend.

We also plan to replace the remaining rule-based classifiers with trained models and add the ability to track how a child's scores change over multiple visits.

---

## 10. In Short

NeuroStep doesn't replace a doctor. It helps families figure out sooner whether they should see one. By turning clinical screening criteria into short, engaging games and running everything in the browser, it brings early autism detection to families who might otherwise wait months or years — with nothing more than a laptop, a webcam, and fifteen minutes.

---

*Built with care for every child's future.*
