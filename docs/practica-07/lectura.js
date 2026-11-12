/* Lecturas generadas: tablas adaptables y retorno, sin peticiones a GitHub. */
document.querySelectorAll('main table').forEach(table=>{
  const wrapper=document.createElement('div');wrapper.className='table-wrap';
  table.before(wrapper);wrapper.append(table);
});
document.querySelector('#back-top').addEventListener('click',()=>window.scrollTo({top:0}));
