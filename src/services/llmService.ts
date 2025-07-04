import { LLMResponse } from '../types'

export type LLMProvider = 'openai' | 'anthropic' | 'google' | 'simulation'

interface LLMConfig {
    provider: LLMProvider
    apiKey?: string
    model?: string
}

export class LLMService {
    private config: LLMConfig

    constructor() {
        const provider = (import.meta.env.VITE_LLM_PROVIDER || 'simulation') as LLMProvider

        this.config = {
            provider,
            apiKey: this.getApiKey(provider),
            model: this.getModel(provider)
        }
    }

    private getApiKey(provider: LLMProvider): string | undefined {
        switch (provider) {
            case 'openai':
                return import.meta.env.VITE_OPENAI_API_KEY
            case 'anthropic':
                return import.meta.env.VITE_ANTHROPIC_API_KEY
            case 'google':
                return import.meta.env.VITE_GOOGLE_API_KEY
            default:
                return undefined
        }
    }

    private getModel(provider: LLMProvider): string {
        switch (provider) {
            case 'openai':
                return import.meta.env.VITE_LLM_MODEL_OPENAI || 'gpt-4o-mini'
            case 'anthropic':
                return import.meta.env.VITE_LLM_MODEL_ANTHROPIC || 'claude-3-haiku-20240307'
            case 'google':
                return import.meta.env.VITE_LLM_MODEL_GOOGLE || 'gemini-1.5-flash'
            default:
                return 'simulation'
        }
    }

    private getSystemPrompt(): string {
        return `You are an expert JSCAD (JavaScript Computer Aided Design) code generator. Your task is to generate valid JSCAD code based on user requests for 3D models.

IMPORTANT RULES:
1. Always generate complete, executable JSCAD code
2. Use CommonJS module syntax (require/module.exports)
3. The main function should return a valid 3D geometry
4. Use appropriate JSCAD primitives and operations
5. Include proper transformations (translate, rotate, scale) when needed
6. Keep code clean and well-commented
7. Handle edge cases gracefully

AVAILABLE JSCAD OPERATIONS:
- Primitives: cuboid, sphere, cylinder, torus, ellipsoid, roundedCuboid
- Transforms: translate, rotate, scale, mirror
- Boolean: union, intersect, subtract

EXAMPLE STRUCTURE:
\`\`\`javascript
// Import primitives
const { cuboid, sphere, cylinder, torus, ellipsoid, roundedCuboid } = require('@jscad/modeling').primitives

// Import transforms
const { translate, rotate, scale, mirror } = require('@jscad/modeling').transforms

// Import boolean operations
const { union, subtract, intersect } = require('@jscad/modeling').booleans

// Import other operations (if needed)
const { colorize, hexToRgb } = require('@jscad/modeling').colors


const main = () => {
  // Create basic shapes
  const box = translate([0, 0, 0], cuboid({ size: [10, 10, 10] }))
  const ball = translate([0, 0, 15], sphere({ radius: 5 }))
  const pipe = translate([15, 0, 0], cylinder({ radius: 3, height: 12 }))
  
  // Combine shapes
  const combined = union(box, ball)
  const final = subtract(combined, pipe)
  
  return final
}

module.exports = { main }
\`\`\`

RESPONSE FORMAT:
- Provide ONLY the JavaScript code
- Do NOT include markdown code blocks
- Do NOT include explanations in the code response
- Ensure all imports are included
- Make sure the main function is exported

Generate JSCAD code for the following request:`
    }

    async generateModel(prompt: string): Promise<LLMResponse> {
        console.log('Generating model with prompt:', prompt)
        try {
            switch (this.config.provider) {
                case 'openai':
                    return await this.callOpenAI(prompt)
                case 'anthropic':
                    return await this.callAnthropic(prompt)
                case 'google':
                    return await this.callGoogle(prompt)
                default:
                    return await this.simulateResponse(prompt)
            }
        } catch (error) {
            console.error(`Error calling ${this.config.provider}:`, error)
            // Fallback to simulation on error
            return await this.simulateResponse(prompt)
        }
    }

    private async callOpenAI(prompt: string): Promise<LLMResponse> {
        if (!this.config.apiKey) {
            throw new Error('OpenAI API key not configured')
        }

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.config.apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: this.config.model,
                messages: [
                    {
                        role: 'system',
                        content: this.getSystemPrompt()
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.1
            }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`)
        }

        const data = await response.json()
        const code = this.extractCode(data.choices[0].message.content)

        return {
            code,
            explanation: `Generated ${this.describeModel(prompt)} using OpenAI ${this.config.model}`
        }
    }

    private async callAnthropic(prompt: string): Promise<LLMResponse> {
        if (!this.config.apiKey) {
            throw new Error('Anthropic API key not configured')
        }

        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'x-api-key': this.config.apiKey,
                'Content-Type': 'application/json',
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: this.config.model,
                max_tokens: 1000,
                messages: [
                    {
                        role: 'user',
                        content: `${this.getSystemPrompt()}\n\n${prompt}`
                    }
                ]
            }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(`Anthropic API error: ${errorData.error?.message || response.statusText}`)
        }

        const data = await response.json()
        const code = this.extractCode(data.content[0].text)

        return {
            code,
            explanation: `Generated ${this.describeModel(prompt)} using Anthropic ${this.config.model}`
        }
    }

    private async callGoogle(prompt: string): Promise<LLMResponse> {
        if (!this.config.apiKey) {
            throw new Error('Google API key not configured')
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.config.apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${this.getSystemPrompt()}\n\n${prompt}`
                    }]
                }],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 1000
                }
            }),
        })

        if (!response.ok) {
            const errorData = await response.json()
            throw new Error(`Google API error: ${errorData.error?.message || response.statusText}`)
        }

        const data = await response.json()
        const code = this.extractCode(data.candidates[0].content.parts[0].text)

        return {
            code,
            explanation: `Generated ${this.describeModel(prompt)} using Google ${this.config.model}`
        }
    }

    private extractCode(response: string): string {
        // Remove markdown code blocks if present
        let code = response.replace(/```(?:javascript|js)?\n?/g, '').replace(/```\n?/g, '')

        // Clean up the code
        code = code.trim()

        // Ensure it has the basic structure
        if (!code.includes('module.exports')) {
            // Try to wrap it if it's just the main function
            if (code.includes('const main = ') || code.includes('function main(')) {
                code += '\n\nmodule.exports = { main }'
            }
        }

        console.log('Extracted code:', code)

        return code
    }

    private describeModel(prompt: string): string {
        const lower = prompt.toLowerCase()
        if (lower.includes('cube') || lower.includes('box')) return 'cube'
        if (lower.includes('sphere') || lower.includes('ball')) return 'sphere'
        if (lower.includes('cylinder')) return 'cylinder'
        if (lower.includes('torus') || lower.includes('donut')) return 'torus'
        return '3D model'
    }

    private async simulateResponse(prompt: string): Promise<LLMResponse> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000))

        let code = ''
        let explanation = ''

        const lowerPrompt = prompt.toLowerCase()

        if (lowerPrompt.includes('cube') || lowerPrompt.includes('box')) {
            const size = this.extractNumber(prompt, 10)
            code = `const { cuboid } = require('@jscad/modeling').primitives
const { translate } = require('@jscad/modeling').transforms

const main = () => {
  return translate([0, 0, 0], cuboid({ size: [${size}, ${size}, ${size}] }))
}

module.exports = { main }`
            explanation = `Created a ${size}x${size}x${size} cube using simulation mode`
        } else if (lowerPrompt.includes('sphere') || lowerPrompt.includes('ball')) {
            const radius = this.extractNumber(prompt, 5)
            code = `const { sphere } = require('@jscad/modeling').primitives
const { translate } = require('@jscad/modeling').transforms

const main = () => {
  return translate([0, 0, 0], sphere({ radius: ${radius} }))
}

module.exports = { main }`
            explanation = `Created a sphere with radius ${radius} using simulation mode`
        } else if (lowerPrompt.includes('cylinder')) {
            const radius = this.extractNumber(prompt, 3)
            const height = this.extractNumber(prompt, 10, ['height', 'tall', 'high'])
            code = `const { cylinder } = require('@jscad/modeling').primitives
const { translate } = require('@jscad/modeling').transforms

const main = () => {
  return translate([0, 0, 0], cylinder({ radius: ${radius}, height: ${height} }))
}

module.exports = { main }`
            explanation = `Created a cylinder with radius ${radius} and height ${height} using simulation mode`
        } else if (lowerPrompt.includes('torus') || lowerPrompt.includes('donut')) {
            const outerRadius = this.extractNumber(prompt, 5)
            const innerRadius = Math.max(1, outerRadius * 0.3)
            code = `const { torus } = require('@jscad/modeling').primitives
const { translate } = require('@jscad/modeling').transforms

const main = () => {
  return translate([0, 0, 0], torus({ 
    innerRadius: ${innerRadius}, 
    outerRadius: ${outerRadius} 
  }))
}

module.exports = { main }`
            explanation = `Created a torus with outer radius ${outerRadius} and inner radius ${innerRadius} using simulation mode`
        } else {
            code = `const { cuboid } = require('@jscad/modeling').primitives
const { translate } = require('@jscad/modeling').transforms

const main = () => {
  return translate([0, 0, 0], cuboid({ size: [5, 5, 5] }))
}

module.exports = { main }`
            explanation = 'Created a default 5x5x5 cube using simulation mode. Try asking for specific shapes!'
        }

        return { code, explanation }
    }

    private extractNumber(text: string, defaultValue: number, keywords: string[] = []): number {
        const numbers = text.match(/\d+(\.\d+)?/g)

        if (numbers && numbers.length > 0) {
            if (keywords.length > 0) {
                for (const keyword of keywords) {
                    const regex = new RegExp(`${keyword}\\s*(\\d+(?:\\.\\d+)?)|(\\d+(?:\\.\\d+)?)\\s*${keyword}`, 'i')
                    const match = text.match(regex)
                    if (match) {
                        return parseFloat(match[1] || match[2])
                    }
                }
            }
            return parseFloat(numbers[0])
        }

        return defaultValue
    }

    getProviderInfo(): { provider: LLMProvider; hasApiKey: boolean; model: string } {
        return {
            provider: this.config.provider,
            hasApiKey: !!this.config.apiKey || this.config.provider === 'simulation',
            model: this.config.model || 'unknown'
        }
    }
} 