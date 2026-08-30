import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

dotenv.config();

const app = express();
const PORT = 3000;

// Body parser with 10mb limit for base64 herb images
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

// Server-side API endpoints (The Backend Core)
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});

// Configure Gemini on Backend Server (Keep process.env.GEMINI_API_KEY secure)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

const generationConfig = {
  temperature: 0.7,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 2048,
};

const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

const SYSTEM_PROMPT = `
Bạn là Bác sĩ Tâm An, một trợ lý y tế AI thông minh và thân thiện. 
Nhiệm vụ của bạn là cung cấp kiến thức y tế, giải đáp thắc mắc về sức khỏe, giải phẫu cơ thể người, bệnh lý và các phương pháp chăm sóc sức khỏe tự nhiên (thuốc nam, yoga, thiền).

QUY TẮC QUAN TRỌNG:
1. LUÔN BẮT ĐẦU VỚI LỜI CHÀO THÂN THIỆN.
2. KHÔNG chẩn đoán bệnh chính xác hoặc kê đơn thuốc cụ thể.
3. KHÔNG khuyên người dùng bỏ thuốc của bác sĩ đang điều trị.
4. LUÔN khuyến khích người dùng gặp bác sĩ chuyên khoa cho các vấn đề nghiêm trọng.
5. Cung cấp thông tin dựa trên cơ sở khoa học và y học cổ truyền Việt Nam một cách cân bằng.
6. Khi đề cập đến giải phẫu, hãy mô tả rõ ràng vị trí và chức năng.
7. Khi gợi ý cây thuốc nam, hãy nhắc nhở về liều lượng và chống chỉ định (nếu biết).
8. Sử dụng tiếng Việt chuẩn, dễ hiểu, chuyên nghiệp nhưng gần gũi.

Nếu người dùng hỏi về triệu chứng, hãy phân tích sơ bộ và gợi ý các khả năng, sau đó khuyên họ nên theo dõi thêm hoặc đi khám.
Nếu là tình trạng khẩn cấp (đau ngực dữ dội, khó thở, hôn mê...), hãy khuyên họ gọi cấp cứu 115 ngay lập tức.
`;

// 1. POST /api/chat - Secure proxy for Bác sĩ Tâm An AI
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const chat = model.startChat({
      generationConfig,
      safetySettings,
      history: [
        { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
        { role: "model", parts: [{ text: "Tôi hiểu. Tôi đã sẵn sàng hỗ trợ người dùng với tư cách là Bác sĩ Tâm An." }] },
        ...history,
      ],
    });

    const result = await chat.sendMessage(message);
    const reply = result.response.text();
    res.json({ reply });
  } catch (error: any) {
    console.error("Express /api/chat error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// 2. POST /api/identify - Secure herb identification
app.post("/api/identify-herb", async (req, res) => {
  try {
    const { base64Image } = req.body;
    if (!base64Image) {
      return res.status(400).json({ error: "Image is required" });
    }

    const model = genAI.getGenerativeModel({ 
      model: "gemini-3.5-flash",
      generationConfig: {
        ...generationConfig,
        responseMimeType: "application/json",
      }
    });

    const prompt = `Nhận diện cây thuốc trong hình ảnh này. 
    Trả về kết quả dưới dạng JSON với cấu trúc sau:
    {
      "name_vi": "Tên tiếng Việt",
      "name_scientific": "Tên khoa học",
      "family": "Họ thực vật",
      "partUsed": "Bộ phận dùng (vd: lá, rễ, hạt...)",
      "benefits": ["Công dụng 1", "Công dụng 2"],
      "usage": "Cách dùng",
      "dosage": "Liều lượng",
      "contraindications": ["Chống chỉ định 1", "Chống chỉ định 2"],
      "identified": true
    }
    Nếu không nhận diện được hoặc không phải cây thuốc, hãy đặt "identified": false và để các trường khác là null hoặc chuỗi trống.
    CHỈ trả về JSON, không thêm văn bản nào khác.`;

    const part = {
      inlineData: {
        data: base64Image,
        mimeType: "image/jpeg"
      },
    };

    const result = await model.generateContent([prompt, part]);
    const responseText = result.response.text();
    res.json({ result: responseText });
  } catch (error: any) {
    console.error("Express /api/identify-herb error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// 3. POST /api/suggest-herbs - AI herb recommendations based on daily symptoms
app.post("/api/suggest-herbs", async (req, res) => {
  try {
    const { symptoms, mood, energy, sleep, notes, vitals } = req.body;
    
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        ...generationConfig,
        responseMimeType: "application/json",
      }
    });

    const prompt = `Bạn là Bác sĩ Y học Cổ truyền và Dược liệu học Việt Nam (Bác sĩ Tâm An).
Dựa trên thông tin triệu chứng sức khỏe ghi nhận trong ngày của người dùng:
- Triệu chứng khai báo: ${JSON.stringify(symptoms || [])}
- Tâm trạng: ${mood || 'Bình thường'}
- Năng lượng: ${energy || 'Bình thường'}
- Thời lượng ngủ: ${sleep ? `${sleep} giờ` : 'Không rõ'}
- Ghi chú nhật ký: ${notes || 'Không có'}
- Chỉ số sinh hiệu: ${JSON.stringify(vitals || {})}

Hãy phân tích và gợi ý 1 đến 2 vị Dược liệu Việt Nam (cây thuốc nam quen thuộc, lành tính) và bài thuốc / liệu pháp chế biến thích hợp nhất cho ngày hôm nay.

Trả về kết quả chuẩn JSON theo schema sau:
{
  "analysis": "Tóm tắt biện chứng luận trị Đông y ngắn gọn (khoảng 2 câu) giải thích nguyên nhân triệu chứng theo Đông y",
  "recommendedHerbs": [
    {
      "name_vi": "Tên tiếng Việt của cây thuốc",
      "name_scientific": "Tên khoa học",
      "nature": "Tính vị quy kinh (vd: Vị cay, tính ấm, quy kinh phế và tỳ)",
      "mechanism": "Lý do dược thảo này giúp khắc phục triệu chứng hôm nay",
      "remedyTitle": "Tên bài thuốc / cách dùng",
      "ingredients": ["Nguyên liệu 1", "Nguyên liệu 2"],
      "preparation": "Hướng dẫn cách hãm trà / sắc nước / chế biến từng bước ngắn gọn",
      "dosage": "Liều lượng khuyến nghị",
      "bestTime": "Thời điểm dùng tốt nhất (Sáng sớm / Sau ăn / Trước khi ngủ...)",
      "precautions": "Lưu ý hoặc chống chỉ định (ai không nên dùng)"
    }
  ],
  "lifestyleTip": "Lời khuyên sinh hoạt / dưỡng sinh bổ trợ trong ngày (chế độ ăn, bài tập thở, ngâm chân, giữ ấm...)"
}
CHỈ trả về JSON hợp lệ, không kèm bất kỳ giải thích ngoài.`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    res.json({ result: responseText });
  } catch (error: any) {
    console.error("Express /api/suggest-herbs error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
});

// Vite or Static assets integration
async function main() {
  if (process.env.NODE_ENV !== "production") {
    // Development Mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite development server middleware loaded.");
  } else {
    // Production Mode
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("Serving static production assets from /dist.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[BackEnd Server] Running on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Failed to start full-stack server:", err);
});
