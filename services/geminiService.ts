import { GoogleGenAI, Type } from "@google/genai";

let aiInstance: any = null;

const getAI = () => {
  if (!aiInstance) {
    let apiKey = '';
    // Tenta pegar a chave injetada pelo AI Studio
    try {
      if (typeof process !== 'undefined' && process.env && process.env.GEMINI_API_KEY) {
        apiKey = process.env.GEMINI_API_KEY;
      }
    } catch(e) {}
    
    // Tenta pegar a chave do ambiente de produção normal (Vercel)
    if (!apiKey) {
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
      model: "gemini-2.5-flash",
      contents: `CONTEXTO DE EXTRAÇÃO: ${contextInstruction}\nTexto: "${text}"`,
      config: {
        systemInstruction: `Você é um extrator de dados JSON de ELITE para motoristas brasileiros (Uber/99).
        Sua missão é extrair informações de viagens a partir de áudios que podem ser confusos.
        
        DIRETRIZES TÉCNICAS:
        1. DE-DUPLICAÇÃO (CRITICAL): Motoristas costumam repetir palavras ("Carlos Carlos", "nove nove"). Ignore a repetição e retorne apenas a informação uma vez.
        2. WHATSAPP: Remova preposições ("e", "zap", "zap zap"). Se falar "zero trinta e cinco nove...", remova o zero inicial do DDD. Priorize 11 dígitos.
        3. ENDEREÇO/CIDADE: Se o motorista falar "no hospital de passos", o endereço é "Hospital" e a cidade é "Passos". Remova "em", "no", "na", "de" que venham antes de locais.
        4. TARIFA: Extraia apenas o número. "cinquenta conto" -> "50". "vinte e cinco e cinquenta" -> "25.50".
        
        REGRAS DE OURO:
        - Se o CONTEXTO for 'passenger', deixe campos de rota como null.
        - Se o CONTEXTO for 'route', deixe campos de passageiro como null.
        - NUNCA invente informações. Se não houver clareza, retorne null.
        
        EXEMPLOS (Few-Shot):
        - Entrada: "Carlos Carlos zap nove nove um dois três quatro cinco seis sete" (Contexto: passenger)
          Saída: {"passengerName": "Carlos", "whatsapp": "991234567"}
          
        - Entrada: "hospital de passos valor trinta e cinco e cinquenta" (Contexto: route)
          Saída: {"destinationAddress": "Hospital", "destinationCity": "Passos", "fare": "35.50"}
          
        - Entrada: "Rua Sete 210 Centro" (Contexto: route)
          Saída: {"destinationAddress": "Rua Sete, Centro", "destinationNumber": "210"}`,
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
      const result = JSON.parse(response.text.trim());
      return result;
    }
    return null;
  } catch (error) {
    console.error("Gemini Parsing Error:", error);
    return null;
  }
};
