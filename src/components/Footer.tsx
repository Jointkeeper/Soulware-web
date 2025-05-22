import React from 'react';

export function Footer() {
  return (
    <footer className="text-center text-gray-500 text-sm p-4 border-t border-gray-700 mt-12">
      <div className="mb-2">
        <strong>Я кем-то был<br/>Я некто<br/>Я кем-то стану</strong>
      </div>
      <div className="mb-2">
        Soulware — психологическая платформа для самопознания, развития и тестирования. Здесь вы найдете личностные, профессиональные, мифологические, юмористические и AI-тесты, а также персональные рекомендации и аналитику.
      </div>
      <div className="mb-2">
        <a href="https://soulware.app" className="text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer">soulware.app</a>
      </div>
      <div>
        © 2025 Soulware. Все права защищены.
      </div>
    </footer>
  );
} 