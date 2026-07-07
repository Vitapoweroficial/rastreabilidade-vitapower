import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const modules = [
  ['CRM','Clientes, contatos, pipeline e historico'],
  ['Private Label','Projetos, briefing, proposta e fluxo'],
  ['Precificacao','Custos, perda, embalagem, taxas e margem'],
  ['Formulas','Composicao, BOM e memoriais'],
  ['Producao','OP, PCP e apontamentos'],
  ['Qualidade','CQ, laudos e liberacao'],
  ['Rastreabilidade','Lotes, MP e expedicao']
];

function App(){
  return React.createElement('div',{className:'app'},
    React.createElement('aside',{className:'side'},
      React.createElement('div',{className:'brand'},'Vita Power ERP'),
      modules.map(function(m){return React.createElement('a',{href:'#'+m[0],key:m[0]},m[0]);})
    ),
    React.createElement('main',{className:'main'},
      React.createElement('section',{className:'hero'},
        React.createElement('h1',null,'Vita Power Workspace'),
        React.createElement('p',null,'ERP industrial para clientes, private label, formulas, precificacao, producao, qualidade e rastreabilidade.')
      ),
      React.createElement('section',{className:'grid'},
        modules.map(function(m){return React.createElement('article',{className:'card',key:m[0]},React.createElement('h2',null,m[0]),React.createElement('p',null,m[1]));})
      )
    )
  );
}

createRoot(document.getElementById('root')).render(React.createElement(App));
