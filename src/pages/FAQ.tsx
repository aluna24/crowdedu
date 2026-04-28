import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import OperatingHours from "@/components/OperatingHours";

const faqs = [
  { q: "Who can use the recreation center?", a: "All currently enrolled students have access with a valid student ID. Faculty, staff, and community members can purchase memberships at the front desk." },
  { q: "Is there a cost for group fitness classes?", a: "Group fitness classes are free for students with a valid recreation membership. Community members may need to purchase a group fitness add-on." },
  { q: "How do intramural sports work?", a: "Register your team before the deadline. Leagues run on a round-robin format with playoffs. Tournaments are single-elimination. All skill levels welcome!" },
  { q: "What should I bring to the rec center?", a: "Bring your student ID, appropriate athletic clothing and shoes, a water bottle, and a towel. Locks are available for rental at the front desk." },
  { q: "Can I reserve courts or rooms?", a: "Courts can be reserved up to 48 hours in advance through the request form on our Reservations page. Rooms for clubs or events require a separate reservation form." },
  { q: "What is the guest policy?", a: "Each member may bring one guest per visit. Guests must sign a waiver and pay a $5 day-pass fee. The sponsoring member must remain with their guest at all times." },
  { q: "Are there personal training services?", a: "Yes! Certified personal trainers are available for individual and small group sessions. Visit the front desk or check the Group Fitness page for more information." },
  { q: "How do I report a maintenance issue?", a: "Report issues to the front desk staff or email recservices@university.edu. Emergency safety concerns should be reported immediately to staff on duty." },
];

const FAQ = () => {
  return (
    <div className="container py-6">
      <h1 className="font-display text-2xl font-bold text-foreground sm:text-3xl">Frequently Asked Questions</h1>
      <p className="mt-1 text-sm text-muted-foreground">Find answers to common questions about the recreation center.</p>

      <div className="mt-6 grid gap-8 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-sm font-medium text-foreground">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        <div className="lg:col-span-2">
          <OperatingHours />
        </div>
      </div>
    </div>
  );
};

export default FAQ;
