export const cvExtractorPrompt = `# CV Data Extraction Task

I'm providing a CV/resume document, and I need you to carefully extract structured information according to our schema.

## Instructions:
1. Thoroughly analyze the entire CV/resume document
2. Extract ALL relevant information that fits our schema
3. Structure the data exactly according to our provided schema
4. Use the CVDetailsSchema tool to submit your extracted data

## Guidelines for Specific Fields:
- Professional Summary: Create a concise 2-3 sentence summary if not explicitly provided
- Work Experience: 
  * Extract detailed responsibilities and achievements from bullet points
  * Format dates consistently (YYYY-MM format if possible)
  * Mark current position appropriately
  * If resume uses phrases like "Present" or "Current," set isCurrentPosition to true
- Education: Format degree information consistently (e.g., "Bachelor of Science", "Master of Arts")
  * Convert degree abbreviations to full names (e.g., "BS" to "Bachelor of Science")

## Handling Edge Cases:
- If information is ambiguous, use your best judgment and prioritize accuracy
- If required fields are missing (fullName, email, workExperience, education), provide placeholder text indicating "Not found in document"
- For missing optional fields, simply omit them
- If dates are unclear, use approximate dates and note uncertainty

## Example Output Structure:
Here's how a properly extracted CV might look (abbreviated example):

\`\`\`json
{
  "fullName": "Jane Smith",
  "email": "jane.smith@email.com",
  "phoneNumber": "555-123-4567",
  "location": "Seattle, WA",
  "professionalSummary": "Senior software engineer with 8 years of experience in cloud architecture and distributed systems. Specialized in AWS infrastructure and microservices design.",
  "workExperience": [
    {
      "companyName": "Tech Solutions Inc.",
      "position": "Senior Software Engineer",
      "startDate": "2020-06",
      "isCurrentPosition": true,
      "responsibilities": [
        "Led development of cloud-native microservices using AWS Lambda and API Gateway",
        "Implemented CI/CD pipelines using GitHub Actions"
      ],
    }
  ],
}
\`\`\`

Please focus on extracting ALL relevant information while maintaining high accuracy. The extracted data will be used for candidate evaluation, so completeness and correctness are essential.`;
