// Mock data for AI Feedback feature — matches PRD and mockup designs

export interface RubricCategory {
  name: string;
  description: string;
}

export interface FeedbackItem {
  id: string;
  documentTitle: string;
  rubricCategory: string;
  excerpt: string;
  explanation: string;
}

export interface AIFeedbackDocument {
  id: string;
  fileName: string;
  fileType: "docx" | "pdf";
  title: string;
  subject: string;
  extractedText: string;
  rubricCategories: RubricCategory[];
  status: "uploading" | "extracting" | "analyzing" | "complete" | "error";
  feedbackItems: FeedbackItem[];
  feedbackCount: number;
  createdAt: string;
  isTruncated?: boolean;
  errorMessage?: string;
}

export interface DiscussMessage {
  id: string;
  role: "user" | "ai";
  content: string;
}

export const MOCK_DOCUMENTS: AIFeedbackDocument[] = [
  {
    id: "doc-1",
    fileName: "social-media-essay.docx",
    fileType: "docx",
    title: "The Role of Social Media in Modern Democracy",
    subject: "English",
    status: "complete",
    feedbackCount: 4,
    createdAt: "6 days ago",
    isTruncated: false,
    rubricCategories: [
      { name: "Argument Structure", description: "Strength and coherence of the central argument" },
      { name: "Evidence & Sources", description: "Quality and relevance of supporting evidence" },
      { name: "Critical Thinking", description: "Depth of analysis and consideration of counterarguments" },
      { name: "Grammar & Style", description: "Clarity, grammar, and writing style" },
    ],
    extractedText: `The Role of Social Media in Modern Democracy

Introduction

Social media has mostly helped democracy by letting more people share their opinions. Platforms like Twitter, Instagram, and TikTok give ordinary citizens a voice that was previously only available to politicians and journalists. This essay will argue that, on balance, social media strengthens democratic participation.

The Rise of Digital Political Engagement

Studies show that young people are more politically engaged because of social media. Voter registration drives on Instagram and political discussions on Reddit have brought millions of first-time voters into the democratic process. When a politician makes a decision, citizens can immediately respond, creating a feedback loop that didn't exist before.

The Spread of Misinformation

Of course, there is some misinformation, but overall the benefits outweigh the risks. Social media companies are working to combat fake news, and users are becoming more media-literate over time.

Conclusion

In conclusion, social media has been a net positive for democracy. While challenges remain, the ability for ordinary citizens to participate in political discourse far outweighs the negatives.`,
    feedbackItems: [
      {
        id: "fb-1",
        documentTitle: "The Role of Social Media in Modern Democracy",
        rubricCategory: "Argument Structure",
        excerpt:
          '"Social media has mostly helped democracy by letting more people share their opinions."',
        explanation:
          'Your thesis states that social media "mostly helps democracy" — what specific aspect of democracy are you focusing on, and how might narrowing this claim make your argument more defensible?',
      },
      {
        id: "fb-2",
        documentTitle: "The Role of Social Media in Modern Democracy",
        rubricCategory: "Evidence & Sources",
        excerpt:
          '"Studies show that young people are more politically engaged because of social media."',
        explanation:
          "Which studies are you referring to? Without citing specific research, this claim lacks credibility. Consider referencing Pew Research Center data or academic studies on youth political engagement.",
      },
      {
        id: "fb-3",
        documentTitle: "The Role of Social Media in Modern Democracy",
        rubricCategory: "Critical Thinking",
        excerpt:
          '"Of course, there is some misinformation, but overall the benefits outweigh the risks."',
        explanation:
          "You acknowledge that misinformation is a problem, but then move on quickly. If misinformation can undermine the very engagement you praised earlier, how does that affect the overall balance of your argument?",
      },
      {
        id: "fb-4",
        documentTitle: "The Role of Social Media in Modern Democracy",
        rubricCategory: "Grammar & Style",
        excerpt:
          '"In conclusion, social media has been a net positive for democracy."',
        explanation:
          'Your conclusion restates the thesis without synthesizing the arguments made. Consider summarizing how your specific points build toward your conclusion rather than simply repeating your opening claim.',
      },
    ],
  },
  {
    id: "doc-2",
    fileName: "photosynthesis-lab-report.pdf",
    fileType: "pdf",
    title: "Photosynthesis Lab Report — Light Intensity Experiment",
    subject: "Science",
    status: "complete",
    feedbackCount: 2,
    createdAt: "Mar 3",
    isTruncated: false,
    rubricCategories: [
      { name: "Data Interpretation", description: "Accuracy and depth of data analysis" },
      { name: "Methodology", description: "Rigor and reproducibility of experimental methods" },
    ],
    extractedText: `Photosynthesis Lab Report — Light Intensity Experiment

Purpose

The purpose of this experiment is to investigate how varying light intensity affects the rate of photosynthesis in aquatic plants (Elodea canadensis).

Hypothesis

If the light intensity increases, then the rate of photosynthesis will increase because more photons are available for the light-dependent reactions.

Materials and Methods

We placed Elodea stems in beakers of water at different distances from a light source (10cm, 20cm, 30cm, 40cm, 50cm). We counted oxygen bubbles produced per minute over 5-minute intervals, repeating each distance three times.

Results

At 10cm distance, we observed an average of 45 bubbles per minute. At 20cm, 32 bubbles. At 30cm, 21 bubbles. At 40cm, 14 bubbles. At 50cm, 8 bubbles.

Discussion

The results support our hypothesis. As distance from the light source increased, the rate of photosynthesis decreased, as measured by oxygen bubble production.

Conclusion

Light intensity has a direct positive correlation with photosynthesis rate in Elodea canadensis.`,
    feedbackItems: [
      {
        id: "fb-5",
        documentTitle: "Photosynthesis Lab Report — Light Intensity Experiment",
        rubricCategory: "Data Interpretation",
        excerpt: '"The results support our hypothesis."',
        explanation:
          "While your results do show a trend, consider whether the relationship is linear or follows an inverse square law. Plotting your data and discussing the curve shape would strengthen your analysis significantly.",
      },
      {
        id: "fb-6",
        documentTitle: "Photosynthesis Lab Report — Light Intensity Experiment",
        rubricCategory: "Methodology",
        excerpt:
          '"We counted oxygen bubbles produced per minute over 5-minute intervals."',
        explanation:
          "Counting bubbles is a common but imprecise method. Discuss potential sources of error — bubble size variation, dissolved oxygen, temperature changes — and how they might affect your results.",
      },
    ],
  },
  // Mock: loading state card
  {
    id: "doc-3",
    fileName: "history-essay.docx",
    fileType: "docx",
    title: "",
    subject: "",
    status: "analyzing",
    feedbackCount: 0,
    createdAt: "Just now",
    rubricCategories: [],
    extractedText: "",
    feedbackItems: [],
  },
  // Mock: error state card
  {
    id: "doc-4",
    fileName: "chemistry-report.pdf",
    fileType: "pdf",
    title: "Chemistry Lab Report",
    subject: "Science",
    status: "error",
    feedbackCount: 0,
    createdAt: "2 days ago",
    rubricCategories: [],
    extractedText: "",
    feedbackItems: [],
    errorMessage: "Analysis failed. Please try again.",
  },
];

export const MOCK_DISCUSS_MESSAGES: DiscussMessage[] = [
  {
    id: "msg-1",
    role: "ai",
    content:
      "You acknowledge that misinformation is a problem, but then move on quickly. If misinformation can undermine the very engagement you praised earlier, how does that affect the overall balance of your argument?",
  },
];

export function getDocumentById(id: string): AIFeedbackDocument | undefined {
  return MOCK_DOCUMENTS.find((doc) => doc.id === id);
}
