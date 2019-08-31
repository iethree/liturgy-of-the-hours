//tagging.js

function updateTag(event){
	let btn = event.target;
	let id = btn.getAttribute('data-id');
	let field = btn.getAttribute('data-category');
	let tag = btn.innerText;
	let operation = btn.classList.contains('is-dark') ? '/removeTag' : '/addTag';
	btn.classList.toggle('is-loading');

	console.log(id, field, tag, operation);

	fetch(operation,{
		method: "POST",
		headers: {"Content-Type": "application/json"},
		body: JSON.stringify({
			id: id,
			field, field,
			tag: tag
		})
	}).then(r=>{
		if(r.ok)
			btn.classList.toggle('is-dark');
	}).finally(e=>{
		btn.classList.toggle('is-loading');
	});
}