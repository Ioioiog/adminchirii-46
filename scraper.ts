import * as puppeteer from 'puppeteer';
import * as dotenv from 'dotenv';
import { CaptchaService } from './services/captcha';

dotenv.config();

// Types
interface Invoice {
    invoiceNumber: string;
    issueDate: string;
    dueDate: string;
    energyConsumption: string;
    amount: string;
    remainingPayment: string;
    status: string;
    downloadUrl?: string;
    type: 'gas' | 'electricity';
}

interface FormState {
    hasForm: boolean;
    usernameValue: string | undefined;
    passwordValue: string | undefined;
    errorMessage: string | undefined;
}

// Configuration
const CONFIG = {
    loginUrl: 'https://my.engie.ro/autentificare',
    invoicesUrl: 'https://my.engie.ro/facturi/istoric',
    fallbackInvoicesUrl: 'https://my.engie.ro/facturi',
    defaultTimeout: 120000,
    captchaRetries: 3,
    navigationTimeout: 10000,
    tyingDelay: 50,
    fieldDelay: 500,
    pageLoadDelay: 5000,
    defaultCaptchaSiteKey: '6LeqYkkgAAAAAGa5Jl5qmTHK_Nl4_40-YfU4NN71'
};

// Service classes


class BrowserManager {
    private browser: puppeteer.Browser | null = null;
    
    async launch(): Promise<puppeteer.Browser> {
        this.browser = await puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process'
            ]
        });
        return this.browser;
    }
    
    async createPage(): Promise<puppeteer.Page> {
        if (!this.browser) {
            throw new Error('Browser not launched');
        }
        
        const page = await this.browser.newPage();
        this.configurePage(page);
        return page;
    }
    
    private configurePage(page: puppeteer.Page): void {
        // Set timeouts
        page.setDefaultNavigationTimeout(CONFIG.defaultTimeout);
        page.setDefaultTimeout(CONFIG.defaultTimeout);

        // Set viewport size
        page.setViewport({ width: 1920, height: 1080 });

        // Enable JavaScript console logging
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('error', err => console.error('PAGE ERROR:', err));
        page.on('pageerror', err => console.error('PAGE ERROR:', err));

        // Set up request interception to modify CSP headers
        page.setRequestInterception(true);
        page.on('request', request => {
            const headers = request.headers();
            
            // Remove CSP headers
            delete headers['content-security-policy'];
            delete headers['content-security-policy-report-only'];
            
            // Continue with modified headers
            request.continue({
                ...request,
                headers: {
                    ...headers,
                    'content-security-policy': "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:"
                }
            });
        });
    }
    
    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}

class PageInteraction {
    static async handleCookieConsent(page: puppeteer.Page): Promise<void> {
        try {
            console.log('Waiting for cookie consent modal...');
            await page.waitForSelector('#responsive-cookies-consent-modal___BV_modal_outer_', { timeout: 5000 });
            const acceptAllButton = await page.waitForSelector('button#cookieConsentBtnRight');
            if (acceptAllButton) {
                console.log('Accepting cookies...');
                await acceptAllButton.click();
                await Utilities.delay(1000);
            }
        } catch (e) {
            console.log('Cookie consent modal not found or already handled');
        }
        
        try {
            const acceptButton = await page.$('button[class*="cookie"][class*="accept"], button:contains("Acceptă toate")');
            if (acceptButton) {
                await acceptButton.click();
                console.log('Accepted cookies');
            } else {
                console.log('No cookie consent button found');
            }
        } catch (e) {
            console.log('Cookie consent not found or already accepted');
        }
    }
    
    static async fillCredentials(page: puppeteer.Page): Promise<void> {
        const usernameSelector = '#username';
        const passwordSelector = '#password';
        
        await page.waitForSelector(usernameSelector, { visible: true });
        await page.waitForSelector(passwordSelector, { visible: true });
        
        // Wait for form to be fully loaded and interactive
        await Utilities.delay(CONFIG.fieldDelay);
        
        // Get credentials from environment
        const username = process.env.ENGIE_USERNAME;
        const password = process.env.ENGIE_PASSWORD;
        
        if (!username || !password) {
            throw new Error('ENGIE_USERNAME or ENGIE_PASSWORD environment variable not set');
        }
        
        // Fill username
        await this.fillInputField(page, usernameSelector, username);
        
        // Fill password
        await this.fillInputField(page, passwordSelector, password);
        
        // Validate form state
        await this.validateFormState(page, username, password);
    }
    
    private static async fillInputField(page: puppeteer.Page, selector: string, value: string): Promise<void> {
        console.log(`Filling ${selector}...`);
        await page.click(selector);
        await Utilities.delay(CONFIG.fieldDelay);
        await page.focus(selector);
        
        // Clear field
        await page.evaluate((sel) => {
            const input = document.querySelector(sel) as HTMLInputElement;
            if (input) {
                input.value = '';
                input.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }, selector);
        await Utilities.delay(CONFIG.fieldDelay);
        
        // Type value character by character
        for (const char of value) {
            await page.keyboard.type(char);
            await Utilities.delay(CONFIG.tyingDelay);
        }
        await Utilities.delay(CONFIG.fieldDelay);
        
        // Trigger blur event
        await page.evaluate((sel) => {
            const input = document.querySelector(sel) as HTMLInputElement;
            if (input) {
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new Event('blur', { bubbles: true }));
            }
        }, selector);
        await Utilities.delay(CONFIG.fieldDelay);
    }
    
    private static async validateFormState(page: puppeteer.Page, username: string, password: string): Promise<void> {
        const formState = await page.evaluate(() => {
            const form = document.querySelector('form');
            const username = document.querySelector('#username') as HTMLInputElement;
            const password = document.querySelector('#password') as HTMLInputElement;
            const errorDiv = document.querySelector('.error-message');
            
            return {
                hasForm: !!form,
                usernameValue: username?.value,
                passwordValue: password?.value,
                errorMessage: errorDiv?.textContent?.trim()
            };
        });
        
        // Check if values match expected
        const isUsernameValid = formState.usernameValue === username;
        const isPasswordValid = formState.passwordValue === password;
        
        console.log('Form state:', {
            ...formState,
            passwordValue: '***' // Don't log actual password
        });
        
        if (!isUsernameValid || !isPasswordValid) {
            throw new Error(`Form validation failed: Username: ${isUsernameValid}, Password: ${isPasswordValid}`);
        }
    }
    
    static async handlePopups(page: puppeteer.Page): Promise<void> {
        console.log('Checking for MyENGIE popup...');
        try {
            const popupSelectors = ['button.close', '.myengie-popup-close', 'button.myengie-close'];
            for (const selector of popupSelectors) {
                const popupCloseButton = await page.$(selector);
                if (popupCloseButton) {
                    console.log(`Found popup close button with selector: ${selector}`);
                    await popupCloseButton.click();
                    await Utilities.delay(1000);
                    break;
                }
            }
        } catch (e) {
            console.log('MyENGIE popup not found or already closed');
        }
    }
    
    static async navigateToInvoicesPage(page: puppeteer.Page): Promise<boolean> {
        console.log('Navigating to invoices page...');
        
        try {
            // Direct navigation to invoices page
            console.log('Navigating directly to invoices URL...');
            await page.goto(CONFIG.invoicesUrl, { waitUntil: 'networkidle0' });
            
            // Wait for table to be visible
            await page.waitForSelector('table', { timeout: 10000 });
            
            // Verify we're on the right page
            const currentUrl = page.url();
            if (!currentUrl.includes('facturi')) {
                throw new Error('Not on invoices page after navigation');
            }
            
            return true;
        } catch (error) {
            console.error('Failed to navigate to invoices page:', error);
            return false;
        }
    }
    
    static async extractInvoiceData(page: puppeteer.Page): Promise<Invoice[]> {
        // Wait for invoice table
        console.log('Waiting for invoice table...');
        await page.waitForSelector('table.nj-table.nj-table--cards', { timeout: 30000 });
        
        // Wait for invoice table
        await page.waitForSelector('table.nj-table.nj-table--cards', { timeout: 10000 });
        console.log('Found invoice table');
        
        // Give the table time to fully load
        await Utilities.delay(2000);
        
        // Extract invoice data
        console.log('Extracting invoice data...');
        const rawInvoices = await page.evaluate(() => {
            const rows = Array.from(document.querySelectorAll('table.nj-table.nj-table--cards tbody tr'));
            console.log(`Found ${rows.length} invoice rows`);
            
            return rows.map(row => {
                try {
                    // Use specific column selectors with more robust extraction
                    const cells = Array.from(row.querySelectorAll('td'));
                    const cellContents = cells.map(cell => cell.textContent?.trim());
                    console.log('Row cells:', JSON.stringify(cellContents));
                    
                    if (cells.length < 8) {
                        console.error('Not enough cells in row:', cells.length);
                        return null;
                    }

                    // Extract invoice number from the text that includes "local_fire_department"
                    const invoiceNumberMatch = cellContents.find(text => text?.includes('local_fire_department'))?.match(/local_fire_department\s+(\d+)/);
                    const invoiceNumber = invoiceNumberMatch ? invoiceNumberMatch[1] : '';

                    // Find date fields - look for plain date first, then labeled date
                    // Find plain dates first
                    const plainDates = cellContents.filter(text => /^\d{2}\.\d{2}\.\d{4}$/.test(text || ''));
                    
                    // Find issue date
                    const issueDateFromLabel = cellContents.find(text => text?.includes('Emisă la:'))?.match(/(\d{2}\.\d{2}\.\d{4})/)?.[1];
                    const issueDate = issueDateFromLabel || plainDates[0] || '';

                    // Find due date
                    const dueDateFromLabel = cellContents.find(text => text?.includes('Dată scadentă:'))?.match(/(\d{2}\.\d{2}\.\d{4})/)?.[1];
                    const dueDate = dueDateFromLabel || plainDates[1] || '';

                    // Find consumption and amount - look for plain values first, then labeled values
                    const consumptionMatch = cellContents.find(text => /^[\d,.\-]+\s*kWh$/.test(text || ''))?.match(/([\d,.\-]+)/) ||
                        cellContents.find(text => text?.includes('Consum energie:'))?.match(/([\d,.\-]+)\s*kWh/);
                    const energyConsumption = consumptionMatch ? consumptionMatch[1] : '';

                    const amountMatch = cellContents.find(text => /^[\d,.\-]+\s*lei$/.test(text || ''))?.match(/([\d,.\-]+)/) ||
                        cellContents.find(text => text?.includes('Valoare factură:'))?.match(/([\d,.\-]+)\s*lei/);
                    const amount = amountMatch ? amountMatch[1] : '';

                    const remainingMatch = cellContents.find(text => /^[\d,.\-]+\s*lei$/.test(text || ''))?.match(/([\d,.\-]+)/) ||
                        cellContents.find(text => text?.includes('Rest de plată:'))?.match(/([\d,.\-]+)\s*lei/);
                    const remainingPayment = remainingMatch ? remainingMatch[1] : '';

                    // Find status
                    const statusMatch = cellContents.find(text => text?.includes('Status:'))?.replace('Status:', '').trim();
                    const status = statusMatch || '';
                    
                    const extractedFields = {
                        invoiceNumber,
                        issueDate,
                        dueDate,
                        energyConsumption,
                        amount,
                        remainingPayment,
                        status
                    };
                    console.log('Extracted fields:', JSON.stringify(extractedFields));
                    
                    // Extract download URL
                    const pdfLink = cells[7]?.querySelector('a[href*="facturi"][href*=".pdf"], a[href*="invoice"][href*=".pdf"]');
                    const downloadUrl = pdfLink?.getAttribute('href') || undefined;
                    console.log('Download URL:', downloadUrl);
                    
                    // Validate required fields
                    if (!invoiceNumber || !issueDate || !dueDate || !amount) {
                        console.log('Missing required fields:', {
                            invoiceNumber: !!invoiceNumber,
                            issueDate: !!issueDate,
                            dueDate: !!dueDate,
                            amount: !!amount
                        });
                        return null;
                    }
                    
                    // Determine invoice type from download URL
                    const type = (downloadUrl?.toLowerCase().includes('gaz') ?? false) ? 'gas' : 'electricity';
                    
                    return {
                        invoiceNumber,
                        issueDate,
                        dueDate,
                        energyConsumption,
                        amount,
                        remainingPayment,
                        status,
                        downloadUrl,
                        type
                    };
                } catch (error) {
                    console.error('Error extracting invoice data:', error);
                    return null;
                }
            });
        });

        // Filter out nulls and invalid invoices
        const validInvoices = rawInvoices
            .filter((invoice): invoice is NonNullable<typeof invoice> => invoice !== null)
            .filter(invoice => {
                // Validate required fields
                if (!invoice.invoiceNumber || !invoice.issueDate || !invoice.amount ||
                    !invoice.dueDate || !invoice.energyConsumption || 
                    !invoice.remainingPayment || !invoice.status) {
                    console.log('Invalid invoice: missing required fields');
                    return false;
                }

                // Validate type
                if (invoice.type !== 'gas' && invoice.type !== 'electricity') {
                    console.log('Invalid invoice: invalid type:', invoice.type);
                    return false;
                }

                return true;
            })
            .map(invoice => {
                // Convert to Invoice type
                const result: Invoice = {
                    invoiceNumber: invoice.invoiceNumber,
                    issueDate: invoice.issueDate,
                    dueDate: invoice.dueDate,
                    energyConsumption: invoice.energyConsumption,
                    amount: invoice.amount,
                    remainingPayment: invoice.remainingPayment,
                    status: invoice.status,
                    type: invoice.type as 'gas' | 'electricity'
                };

                if (invoice.downloadUrl) {
                    result.downloadUrl = invoice.downloadUrl;
                }

                return result;
            });

        return validInvoices;
    }
}

class Utilities {
    static async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Main scraper class
class EngieInvoiceScraper {
    private browserManager: BrowserManager;
    private captchaService: CaptchaService;
    
    constructor() {
        this.browserManager = new BrowserManager();
        this.captchaService = new CaptchaService(process.env.TWO_CAPTCHA_API_KEY || '');
    }
    
    async scrapeInvoices(): Promise<Invoice[]> {
        console.log('Starting Engie invoice scraping...');
        let browser: puppeteer.Browser | null = null;
        
        try {
            browser = await this.browserManager.launch();
            const page = await this.browserManager.createPage();
            
            // Navigate to login page
            console.log('Navigating to login page...');
            await page.goto(CONFIG.loginUrl, { waitUntil: 'networkidle0' });
            
            // Handle cookie consent
            await PageInteraction.handleCookieConsent(page);
            
            // Fill login form
            await PageInteraction.fillCredentials(page);
            
            // Handle reCAPTCHA
            await this.handleCaptchaAndLogin(page);
            
            // Wait for page to load after login
            await Utilities.delay(CONFIG.pageLoadDelay);
            
            // Handle popups
            await PageInteraction.handlePopups(page);
            
            // Navigate to invoices page
            const navigationSuccessful = await PageInteraction.navigateToInvoicesPage(page);
            if (!navigationSuccessful) {
                throw new Error('Failed to navigate to invoices page');
            }
            
            // Extract invoice data
            return await PageInteraction.extractInvoiceData(page);
        } catch (error) {
            console.error('Error during scraping:', error);
            throw error;
        } finally {
            if (browser) {
                await this.browserManager.close();
            }
        }
    }
    
    private async handleCaptchaAndLogin(page: puppeteer.Page): Promise<void> {
        // Click the 'Intră în cont' button first
        console.log('Clicking Intră în cont button...');
        await page.click('button.nj-btn.nj-btn--primary');

        // Wait for reCAPTCHA iframe
        console.log('Waiting for reCAPTCHA...');
        await page.waitForSelector('iframe[title="reCAPTCHA"]', { timeout: 10000 });
        
        // Wait for the g-recaptcha-response textarea to be present
        await page.waitForSelector('textarea[name="g-recaptcha-response"]', { hidden: true });

        // Get the sitekey
        const siteKey = await page.evaluate(() => {
            const element = document.querySelector('.g-recaptcha[data-sitekey]');
            return element?.getAttribute('data-sitekey') || '6LeqYkkgAAAAAGa5Jl5qmTHK_Nl4_40-YfU4NN71';
        });

        // Solve the captcha and inject the solution
        await this.captchaService.solveCaptcha(page, page.url());
        
        // Wait a moment for the solution to be processed
        await Utilities.delay(2000);
        
        // Ensure the form is submitted with the captcha token
        await page.evaluate(() => {
            // Find the form element
            const form = document.querySelector('form');
            if (form) {
                // Create and dispatch a submit event
                const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                form.dispatchEvent(submitEvent);
            }
        });
        
        // Wait for successful login
        await Promise.race([
            page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 120000 }),
            page.waitForSelector('.dashboard-container', { timeout: 120000 })
        ]);
        
        // Log current URL and page state
        console.log('Current URL after login:', await page.url());
        console.log('Page title:', await page.title());
    }
}

// Main execution
async function main() {
    try {
        const scraper = new EngieInvoiceScraper();
        const invoices = await scraper.scrapeInvoices();
        console.log('Scraped invoices:', invoices);
    } catch (error) {
        console.error('Failed to scrape invoices:', error);
        process.exit(1);
    }
}

// Run the scraper
main();