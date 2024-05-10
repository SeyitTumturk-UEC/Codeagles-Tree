function addMemberToTree() {
    var name = document.getElementById('member-name').value;
    var memories = document.getElementById('member-memories').value;
    var image = document.getElementById('member-image').files[0]; // Assuming you have a file input for images

    if (name && memories && image) {
        var reader = new FileReader();
        reader.onload = function(e) {
            // Prepare the member object to be saved
            var newMember = {
                name: name,
                memories: memories,
                image: e.target.result // Base64 image representation
            };

            // Save to local storage
            var members = JSON.parse(localStorage.getItem('familyMembers')) || [];
            members.push(newMember);
            localStorage.setItem('familyMembers', JSON.stringify(members));

            // Add member to the tree visually
            addMemberToDOM(newMember);

            // Clear the form fields
            document.getElementById('member-name').value = '';
            document.getElementById('member-memories').value = '';
            document.getElementById('member-image').value = '';
        };
        reader.readAsDataURL(image);
    } else {
        alert('Please fill in all fields and select an image.');
    }
}

function addMemberToDOM(member) {
    var memberDiv = document.createElement('div');
    memberDiv.className = 'family-member';
    memberDiv.innerHTML = `
        <img src="${member.image}" alt="${member.name}" class="member-image">
        <span>${member.name}</span>
        <p>Memories: ${member.memories}</p>
    `;
    document.querySelector('.tree-container').appendChild(memberDiv);
}
document.addEventListener('DOMContentLoaded', function() {
    var storedMembers = JSON.parse(localStorage.getItem('familyMembers')) || [];
    storedMembers.forEach(addMemberToDOM);
});
