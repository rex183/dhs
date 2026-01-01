import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { OnlyFansSection } from "./form-sections/OnlyFansSection";
import { ContentSection } from "./form-sections/ContentSection";
import { ContactSection } from "./form-sections/ContactSection";

const formSchema = z.object({
  // OnlyFans Background
  hasOnlyFans: z.enum(["yes", "no"], {
    required_error: "Please select if you have an OnlyFans account",
  }),
  onlyFansDuration: z.string().min(1, "Please select how long you've been on OnlyFans"),
  hasAgency: z.enum(["yes", "no"], {
    required_error: "Please select if you're working with an agency",
  }),
  monthlyEarning: z.string().min(1, "Please select your monthly earning range"),
  
  // Content & Social
  instagramHandle: z.string().min(1, "Instagram handle is required"),
  contentType: z.array(z.string()).min(1, "Please select at least one content type"),
  helpNeeded: z.array(z.string()).min(1, "Please select what you need help with"),
  
  // Contact Information
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phoneNumber: z.string().min(1, "Phone number is required"),
  additionalNotes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export function ApplyForm() {
  const [currentSection, setCurrentSection] = useState(1);
  const { toast } = useToast();
  const navigate = useNavigate();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hasOnlyFans: undefined,
      onlyFansDuration: "",
      hasAgency: undefined,
      monthlyEarning: "",
      instagramHandle: "",
      contentType: [],
      helpNeeded: [],
      fullName: "",
      email: "",
      phoneNumber: "",
      additionalNotes: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const { error } = await supabase
        .from('applications')
        .insert([
          {
            has_only_fans: data.hasOnlyFans,
            only_fans_duration: data.onlyFansDuration,
            has_agency: data.hasAgency,
            monthly_earning: data.monthlyEarning,
            instagram_handle: data.instagramHandle,
            content_type: data.contentType,
            help_needed: data.helpNeeded,
            full_name: data.fullName,
            email: data.email,
            phone_number: data.phoneNumber,
            additional_notes: data.additionalNotes || null,
          }
        ]);

      if (error) {
        throw error;
      }

      toast({
        title: "Application Submitted!",
        description: "We'll review your application and get back to you within 24 hours.",
      });
      
      // Redirect to home page with popup trigger
      setTimeout(() => {
        navigate('/?submitted=true');
      }, 1500);
      
      form.reset();
      setCurrentSection(1);
    } catch (error: any) {
      console.error("Error submitting application:", error);
      
      // Provide more specific error messages
      let errorMessage = "There was an error submitting your application. Please try again.";
      
      if (error?.message?.includes("Failed to fetch") || error?.message?.includes("ERR_NAME_NOT_RESOLVED")) {
        errorMessage = "Cannot connect to the server. Please check your internet connection and try again.";
      } else if (error?.code) {
        errorMessage = `Database error: ${error.message || error.code}`;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const nextSection = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    
    if (currentSection === 1) {
      fieldsToValidate = ["hasOnlyFans", "onlyFansDuration", "hasAgency", "monthlyEarning"];
    } else if (currentSection === 2) {
      fieldsToValidate = ["instagramHandle", "contentType", "helpNeeded"];
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentSection(currentSection + 1);
    }
  };

  const prevSection = () => {
    setCurrentSection(currentSection - 1);
  };

  const sections = [
    {
      title: "About You",
      description: "Tell us about your OnlyFans background",
    },
    {
      title: "Your Content",
      description: "Share your content & social details",
    },
    {
      title: "Contact Details",
      description: "How we can reach you",
    },
  ];

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-6">
          <div className="w-3 h-3 bg-primary rounded-full mr-2"></div>
          <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider font-heading">
            Step {currentSection} of 3
          </span>
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-2 font-heading">
          {sections[currentSection - 1].title}
        </h2>
        <p className="text-muted-foreground font-body">
          {sections[currentSection - 1].description}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          {sections.map((_, index) => (
            <div
              key={index}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold font-heading transition-all duration-300 ${
                currentSection > index + 1
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : currentSection === index + 1
                  ? "bg-primary text-primary-foreground shadow-lg scale-110"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {index + 1}
            </div>
          ))}
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${(currentSection / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          {currentSection === 1 && <OnlyFansSection control={form.control} />}
          {currentSection === 2 && <ContentSection control={form.control} />}
          {currentSection === 3 && <ContactSection control={form.control} />}

          <div className="flex flex-col sm:flex-row justify-between gap-4 pt-6 sm:pt-8">
            <Button
              type="button"
              variant="outline"
              onClick={prevSection}
              disabled={currentSection === 1}
              className="px-6 sm:px-8 font-heading font-medium w-full sm:w-auto order-1 sm:order-none"
            >
              Back
            </Button>
            
            {currentSection < 3 ? (
              <Button 
                type="button" 
                onClick={nextSection}
                className="px-6 sm:px-8 bg-primary hover:bg-primary/90 font-heading font-medium w-full sm:w-auto order-2 sm:order-none"
              >
                Next
              </Button>
            ) : (
              <Button 
                type="submit"
                className="px-6 sm:px-8 bg-primary hover:bg-primary/90 font-heading font-medium w-full sm:w-auto order-2 sm:order-none"
              >
                Submit Application
              </Button>
            )}
          </div>
        </form>
      </Form>
    </div>
  );
}