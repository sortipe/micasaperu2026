import React, { useEffect } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQGeneratorProps {
  items: FAQItem[];
  title?: string;
  context?: string;
}

const FAQGenerator: React.FC<FAQGeneratorProps> = ({ items, title = 'Preguntas Frecuentes', context }) => {
  const [openIndex, setOpenIndex] = React.useState<number | null>(0);

  useEffect(() => {
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-seo-schema', 'true');
    script.id = 'faq-schema';
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': items.map(item => ({
        '@type': 'Question',
        'name': item.question,
        'acceptedAnswer': {
          '@type': 'Answer',
          'text': item.answer,
        },
      })),
    };
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById('faq-schema');
      if (existing) existing.remove();
    };
  }, [items]);

  if (!items || items.length === 0) return null;

  return (
    <section className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12" aria-label={title}>
      <div className="text-center mb-6 md:mb-8">
        <h2 className="text-lg md:text-2xl font-black text-[#091F4F] uppercase tracking-wider">
          {title}
        </h2>
        {context && (
          <p className="text-sm md:text-base text-gray-600 mt-2 max-w-2xl mx-auto">
            {context}
          </p>
        )}
      </div>
      <div className="space-y-3">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-2xl overflow-hidden transition-all duration-200 hover:border-gray-300"
              itemScope
              itemProp="mainEntity"
              itemType="https://schema.org/Question"
            >
              <button
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="w-full flex items-center justify-between p-4 md:p-5 text-left focus:outline-none focus:ring-2 focus:ring-red-600/20 focus:ring-inset"
                aria-expanded={isOpen}
              >
                <h3
                  className={`text-sm md:text-base font-bold pr-4 transition-colors ${
                    isOpen ? 'text-red-600' : 'text-slate-900'
                  }`}
                  itemProp="name"
                >
                  {item.question}
                </h3>
                <svg
                  className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
                    isOpen ? 'rotate-180 text-red-600' : 'text-gray-400'
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${
                  isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                }`}
                itemScope
                itemProp="acceptedAnswer"
                itemType="https://schema.org/Answer"
              >
                <div className="px-4 md:px-5 pb-4 md:pb-5 text-sm md:text-base text-gray-600 leading-relaxed" itemProp="text">
                  {item.answer}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FAQGenerator;
