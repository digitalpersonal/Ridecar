import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: any = null;

const getAI = () => {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'undefined') {
      console.warn("GEMINI_API_KEY não configurada. Funcionalidade de IA/voz desativada.");
      return null;
    }
    
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};

export interface ParsedRideInfo {
  passengerName?: string;
  whatsapp?: string;
  destinationAddress?: string;
  destinationNumber?: string;
  destinationCity?: string;
  fare?: string;
}

/**
 * Usa o Gemini para extrair informações de uma corrida a partir de um texto (transcrição de áudio).
 */
export const parseRideInfoFromText = async (text: string, context: 'passenger' | 'route' | 'all' = 'all'): Promise<ParsedRideInfo | null> => {
  if (!text || text.length < 3) return null;

  const ai = getAI();
  if (!ai) return null;

  const contextInstruction = context === 'passenger' 
    ? "FOCO: Extraia apenas Nome e WhatsApp. Ignore qualquer menção a endereços ou cidades."
    : context === 'route'
    ? "FOCO: Extraia apenas Destino, Cidade e Valor da Tarifa. Ignore nomes de pessoas."
    : "FOCO: Extraia todas as informações disponíveis (Nome, Zap, Destino, Cidade, Tarifa).";

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: `Contexto: ${contextInstruction}\nTexto capturado: "${text}"`,
      config: {
        systemInstruction: `Você é um extrator de dados ultra-rápido. Extraia os dados do áudio de um motorista para preenchimento de campos de uma corrida.
        Converta o texto em JSON seguindo estritamente o esquema. Se não encontrar um dado, ignore-o.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            passengerName: { type: Type.STRING },
            whatsapp: { type: Type.STRING },
            destinationAddress: { type: Type.STRING },
            destinationNumber: { type: Type.STRING },
            destinationCity: { type: Type.STRING },
            fare: { type: Type.STRING }
          }
        }
      }
    });

    if (response && response.text) {
      console.log("GEMINI: Resposta bruta:", response.text);
      const result = JSON.parse(response.text.trim());
      return result;
    }
    console.warn("GEMINI: Resposta vazia ou inválida", response);
    return null;
  } catch (error: any) {
    console.error("Gemini Error Detail:", error?.message || error);
    return null;
  }
};
