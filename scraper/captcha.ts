import { Page } from 'puppeteer';

export class CaptchaService {
    private apiKey: string;
    private siteKey: string = '6LeqYkkgAAAAAGa5Jl5qmTHK_Nl4_40-YfU4NN71';

    constructor(apiKey: string) {
        console.log('Initializing 2captcha solver with API key:', apiKey.substring(0, 5) + '...');
        this.apiKey = apiKey;
    }

    private async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async submitCaptcha(pageUrl: string): Promise<string> {
        const url = `https://2captcha.com/in.php?key=${this.apiKey}&method=userrecaptcha&googlekey=${this.siteKey}&pageurl=${pageUrl}&json=1`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== 1) {
            throw new Error(`Failed to submit captcha: ${data.request}`);
        }

        return data.request;
    }

    private async getCaptchaResult(captchaId: string): Promise<string> {
        const url = `https://2captcha.com/res.php?key=${this.apiKey}&action=get&id=${captchaId}&json=1`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 0) {
            if (data.request === 'CAPCHA_NOT_READY') {
                throw new Error('CAPTCHA_NOT_READY');
            }
            throw new Error(`Failed to get captcha result: ${data.request}`);
        }

        return data.request;
    }

    async solveCaptcha(page: Page, pageUrl: string): Promise<void> {
        console.log('Solving reCAPTCHA...');
        console.log('Using siteKey:', this.siteKey);
        console.log('Using pageUrl:', pageUrl);
        
        try {
            // Submit the captcha
            console.log('Submitting captcha to 2captcha...');
            const captchaId = await this.submitCaptcha(pageUrl);
            console.log('Captcha submitted, ID:', captchaId);

            // Wait for the result
            console.log('Waiting for captcha solution...');
            let result: string | null = null;
            let attempts = 0;
            const maxAttempts = 30; // 30 attempts * 5 seconds = 2.5 minutes max

            while (!result && attempts < maxAttempts) {
                try {
                    result = await this.getCaptchaResult(captchaId);
                    break;
                } catch (error) {
                    if (error instanceof Error && error.message === 'CAPTCHA_NOT_READY') {
                        console.log('Captcha not ready yet, waiting 5 seconds...');
                        await this.delay(5000);
                        attempts++;
                        continue;
                    }
                    throw error;
                }
            }

            if (!result) {
                throw new Error('Failed to get captcha solution after maximum attempts');
            }

            console.log('reCAPTCHA solved successfully');
            
            // Inject the captcha solution directly into the page
            await page.evaluate((token: string) => {
                // Find all textarea elements with class 'g-recaptcha-response'
                const elements = document.getElementsByClassName('g-recaptcha-response');
                for (let i = 0; i < elements.length; i++) {
                    const element = elements[i] as HTMLTextAreaElement;
                    element.innerHTML = token;
                    // Also set the value property
                    element.value = token;
                }
                
                // Trigger a custom event to notify the form that reCAPTCHA was solved
                const event = new Event('recaptcha-solved', { bubbles: true });
                document.dispatchEvent(event);
            }, result);

        } catch (error) {
            console.error('Failed to solve reCAPTCHA:', error);
            if (error instanceof Error) {
                console.error('Error name:', error.name);
                console.error('Error message:', error.message);
                console.error('Error stack:', error.stack);
            }
            throw error;
        }
    }
}
