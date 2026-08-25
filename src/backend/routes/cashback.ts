import { Router, Request, Response } from 'express';

const router = Router();

const CASHBACK_PACK_DATA = {
  product_title: 'Cashback Stack Pack — Make Your Money Back Today',
  flash_sale_price_usd: 25.00,
  upsell_title: 'Cashback Automation Pack — $9',
  upsell_price_usd: 9.00,
  stanley_ai_trial_url: 'https://ig.getstanley.ai/?ref=cashplugmedia',
  
  modules: [
    {
      id: 'start_here',
      title: 'Start Here (Read First)',
      badge: 'Core Quickstart',
      content: `Welcome to the Cashback Stack Pack. Stop leaving free money on the table.
This system reveals the exact apps, tools, and stacking strategy used to extract cash back on everyday purchases — groceries, gas, food delivery, online shopping, and subscriptions.`,
    },
    {
      id: 'make_25_back',
      title: 'Make Your $25 Back Today (Fast-Action Guide)',
      badge: 'Immediate ROI',
      steps: [
        {
          step: 1,
          name: 'Instant Receipt Scan ($5 – $10 Instant)',
          desc: 'Download Fetch Rewards & Receipt Hog. Scan 3 receipts from the last 7 days to trigger initial welcome reward points.',
        },
        {
          step: 2,
          name: 'Gas Fill-Up Link ($5.00+)',
          desc: 'Open Upside, claim a gas rebate near you (up to $0.25/gal cash back), and pay with a cashback credit card.',
        },
        {
          step: 3,
          name: 'Online Portal Activation ($10 – $15 Instant Bonus)',
          desc: 'Activate Rakuten before ordering food delivery or shopping online to claim your instant $10-$30 welcome bonus.',
        },
      ],
    },
    {
      id: 'stack_list',
      title: 'The Cashback Stack List & App Directory',
      badge: 'App Directory',
      apps: [
        { name: 'Rakuten', type: 'Online Shopping Portal', reward: '1% - 15% Cash Back + $30 Sign-Up Bonus' },
        { name: 'Upside', type: 'Gas & Grocery Rebates', reward: 'Up to 25¢/gal + 10% on Dining' },
        { name: 'Fetch Rewards', type: 'Any-Receipt Scanner', reward: 'Points redeemable for Visa & Amazon Cards' },
        { name: 'Ibotta', type: 'Grocery & Retail Rebates', reward: 'Instant $5 - $20 cash back rebates' },
        { name: 'Dosh', type: 'Automatic Card Linking', reward: 'Passive cash back at restaurants and hotels' },
        { name: 'Honey / PayPal Rewards', type: 'Browser Trigger', reward: 'Auto-applies coupons + cash points' },
      ],
    },
    {
      id: 'stacking_strategy',
      title: 'The Triple-Dip Stacking Strategy',
      badge: 'Pro Multiplier',
      explanation: `Never settle for single cash back. A Triple Dip stacks three reward layers on a single purchase:
Layer 1: 2-5% Cash Back Credit Card
Layer 2: 5-15% Rakuten / Shopping Portal Click-Through
Layer 3: In-Store Loyalty App or Fetch Receipt Upload
Result: 12% - 25% Total Cash Back on normal required spending.`,
    },
    {
      id: 'automation_pack',
      title: 'Cashback Automation Pack (Passive Engine)',
      badge: 'Automation Upsell',
      features: [
        'Auto-activation browser extensions so you never forget a click',
        'Direct card-linked networks for zero-effort restaurant cashback',
        'Stanley AI content & referral automation engine',
      ],
    },
    {
      id: 'copy_kit',
      title: 'Stan Store Paste-Ready Promo Kit',
      badge: 'Marketing Copy',
      stan_copy: {
        headline: 'Make Your Money Back Today',
        tagline: 'Stop leaving free money on the table.',
        delivery_subject: 'Your Cashback Stack Pack is Ready 🎉',
      },
    },
  ],
};

/**
 * Access the Cashback Stack Pack digital modules
 */
router.get('/', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: CASHBACK_PACK_DATA,
  });
});

export default router;
