import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Calendar, Clock, Users, Plane, Mail, Phone } from "lucide-react";
import Section from '@/components/ui/Section';
import SectionTitle from '@/components/ui/SectionTitle';
import { useContent } from '@/contexts/ContentContext';
import { useDesign } from '@/contexts/DesignContext';
import { EMAIL_ENDPOINT } from '../../db_connect';

// Icon mapping
const iconMap = {
  MapPin,
  Calendar,
  Clock,
  Users,
  Plane,
  Mail,
  Phone
};

interface FormData {
  name: string;
  email: string;
  phone: string;
  pickup: string;
  dropoff: string;
  date: string;
  time: string;
  passengers: string;
  flightNumber: string;
  requests: string;
}

const ContactFormSection: React.FC = () => {
  const { getContentForComponent } = useContent();
  const { design } = useDesign();
  
  const content = getContentForComponent<any>('ContactFormSection');

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    pickup: '',
    dropoff: '',
    date: '',
    time: '',
    passengers: '1',
    flightNumber: '',
    requests: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  if (!content) {
    return (
      <Section sectionId="contactForm">
        <div className="max-w-4xl mx-auto px-8 :px-16">
          <div className="space-y-8">
            {Array.from({ length: 8 }).map((_, index) => (
              <div key={index} className="space-y-3">
                <div className="h-4 bg-gray-300 animate-pulse rounded w-32" />
                <div className="h-12 bg-gray-200 animate-pulse rounded" />
              </div>
            ))}
          </div>
        </div>
      </Section>
    );
  }

  const { form } = content;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedbackMessage(null); // Clear any previous message
    
    try {
      // Format the form data into email content
      const subject = `Nova Solicitação de ${formData.name}`;
      const body = `
Nova solicitação recebida:

Nome: ${formData.name}
Email: ${formData.email}
Telefone: ${formData.phone}

Detalhes da Viagem:
Partida: ${formData.pickup}
Destino: ${formData.dropoff}
Data: ${formData.date}
Hora: ${formData.time}
Passageiros: ${formData.passengers}
${formData.flightNumber ? `Número do Voo: ${formData.flightNumber}` : ''}

${formData.requests ? `Pedidos Especiais:\n${formData.requests}` : ''}

Esta mensagem foi enviada através do formulário de contato do website.
      `;

      // Send to Railway endpoint
      console.log('Sending form data:', { subject, body, formData });
      
      const payload = {
        subject: subject,
        body: body,
        from: formData.email, // Include sender email
        senderName: formData.name // Include sender name
      };
      
      console.log('Sending payload:', payload);
      
      const response = await fetch(EMAIL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (response.ok) {
        const result = await response.json();
        console.log('Success response:', result);
        console.log('Email should have been sent to the configured recipient');
        
        if (result.status === 'success') {
          setFeedbackMessage({
            type: 'success',
            text: form.successMessage?.title || 'Pedido enviado com sucesso! Entraremos em contato em breve.'
          });
          
          // Reset form
          setFormData({
            name: '',
            email: '',
            phone: '',
            pickup: '',
            dropoff: '',
            date: '',
            time: '',
            passengers: '1',
            flightNumber: '',
            requests: ''
          });
        } else {
          throw new Error(result.message || 'Unknown error');
        }
      } else {
        const errorData = await response.text();
        console.error('HTTP Error:', response.status, errorData);
        throw new Error(`HTTP ${response.status}: ${errorData}`);
      }
    } catch (error) {
      console.error('Error sending form:', error);
      console.error('Full error details:', {
        message: error.message,
        stack: error.stack,
        formData: formData
      });
      setFeedbackMessage({
        type: 'error',
        text: 'Erro ao enviar pedido. Por favor, tente novamente ou contacte-nos diretamente.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const renderField = (fieldKey: string, fieldConfig: any) => {
    const IconComponent = fieldConfig.icon ? iconMap[fieldConfig.icon as keyof typeof iconMap] : null;
    const baseClasses = "bg-transparent border-0 border-b border-gray-700 text-white text-lg py-4 px-0 rounded-none focus:border-yellow-500 focus:ring-0 placeholder:text-gray-500";

    if (fieldConfig.type === 'select') {
      return (
        <div key={fieldKey} className="space-y-3">
          <Label 
            htmlFor={fieldKey} 
            className="text-gray-400 text-sm font-light uppercase tracking-wider flex items-center gap-2"
          >
            {IconComponent && <IconComponent className="w-4 h-4" />}
            {fieldConfig.label}
          </Label>
          <select
            id={fieldKey}
            name={fieldKey}
            value={formData[fieldKey as keyof FormData]}
            onChange={handleChange}
            className={`${baseClasses} cursor-pointer`}
            required={fieldConfig.required}
          >
            {fieldConfig.options?.map((option: any) => (
              <option key={option.value} value={option.value} className="bg-black">
                {option.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    if (fieldConfig.type === 'textarea') {
      return (
        <div key={fieldKey} className="space-y-3">
          <Label 
            htmlFor={fieldKey} 
            className="text-gray-400 text-sm font-light uppercase tracking-wider"
          >
            {fieldConfig.label}
          </Label>
          <Textarea
            id={fieldKey}
            name={fieldKey}
            value={formData[fieldKey as keyof FormData]}
            onChange={handleChange}
            className={`${baseClasses} min-h-[80px] resize-none`}
            placeholder={fieldConfig.placeholder}
            required={fieldConfig.required}
          />
        </div>
      );
    }

    return (
      <div key={fieldKey} className="space-y-3">
        <Label 
          htmlFor={fieldKey} 
          className="text-gray-400 text-sm font-light uppercase tracking-wider flex items-center gap-2"
        >
          {IconComponent && <IconComponent className="w-4 h-4" />}
          {fieldConfig.label}
        </Label>
        <Input
          id={fieldKey}
          name={fieldKey}
          type={fieldConfig.type}
          value={formData[fieldKey as keyof FormData]}
          onChange={handleChange}
          className={baseClasses}
          placeholder={fieldConfig.placeholder}
          required={fieldConfig.required}
        />
      </div>
    );
  };

  return (
    <Section sectionId="contactForm">
      <div className="max-w-4xl mx-auto px-8 :px-16">
        <div className="text-center mb-16">
          <SectionTitle 
            title={content.title}
            subtitle={content.subtitle}
            description={content.description}
          />
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Full Name */}
          {form.fields.name && renderField('name', form.fields.name)}

          {/* Pickup and Destination */}
          <div className="grid :grid-cols-2 gap-8">
            {form.fields.pickup && renderField('pickup', form.fields.pickup)}
            {form.fields.dropoff && renderField('dropoff', form.fields.dropoff)}
          </div>

          {/* Date and Time */}
          <div className="grid :grid-cols-2 gap-8">
            {form.fields.date && renderField('date', form.fields.date)}
            {form.fields.time && renderField('time', form.fields.time)}
          </div>

          {/* Passengers and Flight Number */}
          <div className="grid :grid-cols-2 gap-8">
            {form.fields.passengers && renderField('passengers', form.fields.passengers)}
            {form.fields.flightNumber && renderField('flightNumber', form.fields.flightNumber)}
          </div>

          {/* Email and Phone */}
          <div className="grid :grid-cols-2 gap-8">
            {form.fields.email && renderField('email', form.fields.email)}
            {form.fields.phone && renderField('phone', form.fields.phone)}
          </div>

          {/* Special Requests */}
          {form.fields.requests && renderField('requests', form.fields.requests)}
          
          <div className="text-center pt-12">
            <Button 
              type="submit"
              disabled={isSubmitting}
              data-element="primaryButton"
              className="transition-all duration-300"
              style={{
                backgroundColor: design.buttons.primary.backgroundColor,
                color: design.buttons.primary.textColor,
                borderColor: design.buttons.primary.borderColor,
                fontFamily: design.buttons.primary.fontFamily,
                fontSize: design.buttons.primary.fontSize,
                fontWeight: design.buttons.primary.fontWeight,
                padding: design.buttons.primary.padding,
                borderRadius: design.buttons.primary.borderRadius,
                borderWidth: design.buttons.primary.borderWidth,
                borderStyle: 'solid',
                opacity: isSubmitting ? 0.6 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = design.buttons.primary.backgroundColorHover;
                  e.currentTarget.style.borderColor = design.buttons.primary.borderColorHover;
                  e.currentTarget.style.color = design.buttons.primary.textColorHover;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) {
                  e.currentTarget.style.backgroundColor = design.buttons.primary.backgroundColor;
                  e.currentTarget.style.borderColor = design.buttons.primary.borderColor;
                  e.currentTarget.style.color = design.buttons.primary.textColor;
                }
              }}
            >
              {isSubmitting ? (form.submitButton?.loadingText || 'A enviar...') : (form.submitButton?.text || 'Solicitar Orçamento')}
            </Button>
            
            {/* Feedback Message */}
            {feedbackMessage && (
              <div className={`mt-6 p-4 rounded-md text-center transition-all duration-300 ${
                feedbackMessage.type === 'success' 
                  ? 'bg-green-100 border border-green-300 text-green-800' 
                  : 'bg-red-100 border border-red-300 text-red-800'
              }`}>
                <p className="font-medium">{feedbackMessage.text}</p>
                {feedbackMessage.type === 'success' && (
                  <div className="flex items-center justify-center mt-2">
                    <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm">Confirmação enviada!</span>
                  </div>
                )}
                <button 
                  type="button"
                  onClick={() => setFeedbackMessage(null)}
                  className="mt-2 text-xs underline hover:no-underline opacity-75 hover:opacity-100"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </Section>
  );
};

export default ContactFormSection;
