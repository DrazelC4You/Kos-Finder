import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

/**
 * @param {object} props
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {{ question: string, answer: string }[]} props.items
 * @param {{ title: string, description: string, buttonText: string, href?: string, onClick?: () => void }} [props.contactInfo]
 */
const FaqSection = React.forwardRef((props, ref) => {
  const { className, title, description, items, contactInfo, ...rest } = props;

  return (
    <section
      ref={ref}
      className={cn(
        'py-16 w-full bg-muted/40',
        className
      )}
      {...rest}
    >
      <div className="container">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto text-center mb-12"
        >
          {/* Tailwind 3 tidak bisa membangun gradient stop dari warna token
              (from-foreground menghasilkan rgba(0,0,0,0)), jadi judulnya warna solid. */}
          <h2 className="text-3xl font-semibold mb-3 text-foreground">
            {title}
          </h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </motion.div>

        {/* FAQ Items */}
        <div className="max-w-2xl mx-auto space-y-2">
          {items.map((item, index) => (
            <FaqItem
              key={index}
              question={item.question}
              answer={item.answer}
              index={index}
            />
          ))}
        </div>

        {/* Contact Section */}
        {contactInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-md mx-auto mt-12 p-6 rounded-lg text-center"
          >
            <div className="inline-flex items-center justify-center p-1.5 rounded-full mb-4">
              <Mail className="h-4 w-4" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {contactInfo.title}
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              {contactInfo.description}
            </p>
            {contactInfo.href ? (
              <Button size="sm" asChild>
                <a href={contactInfo.href}>{contactInfo.buttonText}</a>
              </Button>
            ) : (
              <Button size="sm" onClick={contactInfo.onClick}>
                {contactInfo.buttonText}
              </Button>
            )}
          </motion.div>
        )}
      </div>
    </section>
  );
});
FaqSection.displayName = 'FaqSection';

/**
 * Multi-open disclosure: each item owns its own open state.
 * @param {{ question: string, answer: string, index: number }} props
 */
const FaqItem = React.forwardRef((props, ref) => {
  const { question, answer, index } = props;
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.1 }}
      className={cn(
        'group rounded-lg',
        'transition-all duration-200 ease-in-out',
        'border border-border/50',
        isOpen
          ? 'bg-muted/50'
          : 'hover:bg-muted/50'
      )}
    >
      <Button
        variant="ghost"
        id={`faq-question-${index}`}
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${index}`}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full h-auto px-4 sm:px-6 py-4 justify-between gap-3 text-left whitespace-normal break-words hover:bg-transparent"
      >
        <h3
          className={cn(
            'text-base font-medium transition-colors duration-200 text-left',
            'text-foreground/70',
            isOpen && 'text-foreground'
          )}
        >
          {question}
        </h3>
        <motion.div
          animate={{
            rotate: isOpen ? 180 : 0,
            scale: isOpen ? 1.1 : 1,
          }}
          transition={{ duration: 0.2 }}
          className={cn(
            'p-0.5 rounded-full flex-shrink-0',
            'transition-colors duration-200',
            isOpen ? 'text-primary' : 'text-muted-foreground'
          )}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </Button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{
              height: 'auto',
              opacity: 1,
              transition: { duration: 0.2, ease: 'easeOut' },
            }}
            exit={{
              height: 0,
              opacity: 0,
              transition: { duration: 0.2, ease: 'easeIn' },
            }}
            className="overflow-hidden"
          >
            <div
              id={`faq-answer-${index}`}
              role="region"
              aria-labelledby={`faq-question-${index}`}
              className="px-6 pb-4 pt-2"
            >
              <motion.p
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                className="text-sm text-muted-foreground leading-relaxed"
              >
                {answer}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
FaqItem.displayName = 'FaqItem';

export { FaqSection, FaqItem };
