import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: any = null;

const getAI = () => {
  if (!aiInstance) {
    let apiKey = '';
    
    // 1. Tenta pegar do process.env (Padrao do AI Studio e Node)
    try {
      if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
        apiKey = process.env.GEMINI_API_KEY;
      }
    } catch (e) {}

    // 2. Tenta pegar do import.meta.env (Padrao do Vite/Vercel Client-side)
    // Embora o skill desencoraje, para deploys externos manuais (como Vercel/Github)
    // o Vite exige o prefixo VITE_ para expor ao cliente.
    if (!apiKey) {
      // @ts-ignore
      apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    }

    if (!apiKey) {
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
      model: "gemini-3-flash-preview",
      contents: `CONTEXTO DE EXTRAÇÃO: ${contextInstruction}\nTexto: "${text}"`,
      config: {
        systemInstruction: `Você é um extrator de dados JSON de ELITE para motoristas brasileiros (Uber/99).
        Sua missão é extrair informações de viagens a partir de áudios que podem ser confusos.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            passengerName: { type: Type.STRING, description: "Nome completo ou parcial do passageiro" },
            whatsapp: { type: Type.STRING, description: "Número de telefone ou whatsapp, apenas números" },
            destinationAddress: { type: Type.STRING, description: "Rua, Avenida ou Nome do Estabelecimento (ex: Banco do Brasil, Hospital Regional)" },
            destinationNumber: { type: Type.STRING, description: "Número do local de destino" },
            destinationCity: { type: Type.STRING, description: "Cidade de destino (ex: Guaranésia)" },
            fare: { type: Type.STRING, description: "Valor da tarifa/corrida, apenas números" },
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
