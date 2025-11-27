document.addEventListener('DOMContentLoaded', function() {
  const faqQuestions = document.querySelectorAll('.faq-question');
  
  faqQuestions.forEach(function(question) {
    question.addEventListener('click', function() {
      const faqItem = this.closest('.faq-item');
      const answer = faqItem.querySelector('.faq-answer');
      const isExpanded = this.getAttribute('aria-expanded') === 'true';
      
      // Close all other FAQ items
      document.querySelectorAll('.faq-item').forEach(function(item) {
        if (item !== faqItem) {
          item.classList.remove('active');
          item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
          item.querySelector('.faq-answer').style.maxHeight = null;
        }
      });
      
      // Toggle current item
      if (isExpanded) {
        faqItem.classList.remove('active');
        this.setAttribute('aria-expanded', 'false');
        answer.style.maxHeight = null;
      } else {
        faqItem.classList.add('active');
        this.setAttribute('aria-expanded', 'true');
        answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });
});

