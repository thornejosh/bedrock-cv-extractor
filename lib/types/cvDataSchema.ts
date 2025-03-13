export const CVDataSchema = {
  type: "object",
  properties: {
    fullName: {
      type: "string",
      description: "The full name of the candidate",
    },
    email: {
      type: "string",
      format: "email",
      description: "The email address of the candidate",
    },
    phoneNumber: {
      type: "string",
      description: "The contact phone number of the candidate",
    },
    location: {
      type: "string",
      description: "The geographic location of the candidate",
    },
    professionalSummary: {
      type: "string",
      description:
        "A summary of the candidate's professional background and expertise",
    },
    workExperience: {
      type: "array",
      items: {
        type: "object",
        properties: {
          companyName: {
            type: "string",
            description: "Name of the company where the candidate worked",
          },
          position: {
            type: "string",
            description: "Job title or position held by the candidate",
          },
          startDate: {
            type: "string",
            description: "Start date of employment",
          },
          endDate: {
            type: "string",
            description: "End date of employment",
          },
          isCurrentPosition: {
            type: "boolean",
            description:
              "Indicates if this is the candidate's current position",
          },
          responsibilities: {
            type: "array",
            items: {
              type: "string",
            },
            description: "List of job responsibilities",
          },
        },
        required: ["companyName", "position", "startDate", "responsibilities"],
      },
      description: "The candidate's work history",
    },
    education: {
      type: "array",
      items: {
        type: "object",
        properties: {
          institution: {
            type: "string",
            description: "Name of the educational institution attended",
          },
          degree: {
            type: "string",
            description: "Type of degree obtained",
          },
          fieldOfStudy: {
            type: "string",
            description: "Major or field of study",
          },
          graduationDate: {
            type: "string",
            description: "Date of graduation",
          },
        },
        required: ["institution", "degree", "fieldOfStudy"],
      },
      description: "The candidate's educational background",
    },
  },
  required: ["fullName", "email", "workExperience", "education"],
  additionalProperties: false,
};

// Type definitions for CV data
export type CVData = {
  fullName: string;
  email: string;
  phoneNumber?: string;
  location?: string;
  professionalSummary?: string;
  workExperience: WorkExperience[];
  education: Education[];
};

export type WorkExperience = {
  companyName: string;
  position: string;
  startDate: string;
  endDate?: string;
  isCurrentPosition?: boolean;
  responsibilities: string[];
};

export type Education = {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  graduationDate?: string;
};
