if (!window.faqSectionInitialized) {
  window.faqSectionInitialized = true;
  
  document.addEventListener('click', function(event) {
    const faqQuestion = event.target.closest('.faq-question');
    
    if (!faqQuestion) return;
    
    const faqItem = faqQuestion.closest('.faq-item');
    const faqSection = faqQuestion.closest('.faq-section');
    const answer = faqItem.querySelector('.faq-answer');
    const isExpanded = faqQuestion.getAttribute('aria-expanded') === 'true';
    
    // Close all other FAQ items within the same section
    faqSection.querySelectorAll('.faq-item').forEach(function(item) {
      if (item !== faqItem) {
        item.classList.remove('active');
        item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        item.querySelector('.faq-answer').style.maxHeight = null;
      }
    });
    
    // Toggle current item
    if (isExpanded) {
      faqItem.classList.remove('active');
      faqQuestion.setAttribute('aria-expanded', 'false');
      answer.style.maxHeight = null;
    } else {
      faqItem.classList.add('active');
      faqQuestion.setAttribute('aria-expanded', 'true');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
}

