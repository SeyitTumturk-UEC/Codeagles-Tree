// This function checks the access key entered by the user
function checkAccess() {
    var key = document.getElementById('access-key').value; // Get the entered key from the input field
    if (key === 'codeagles') { // Check if the entered key matches 'codeagles'
        window.location.href = 'trees.html'; // If the key matches, redirect to the trees page
    } else {
        document.getElementById('access-message').textContent = 'Access Denied'; // If the key doesn't match, show an access denied message
    }
}

// This function shows the form to add a new family member
function addMemberForm() {
    document.getElementById('add-member-form').style.display = 'block'; // Display the add member form
}

// This function adds a new member to the tree
function addMemberToTree() {
    var name = document.getElementById('member-name').value;
    var memories = document.getElementById('member-memories').value;
    var imageInput = document.getElementById('member-image');
    var imageFile = imageInput.files[0];

    if (name && memories && imageFile) {
        var reader = new FileReader();
        reader.onload = function (e) {
            var memberDiv = document.createElement('div');
            memberDiv.className = 'family-member';

            var image = new Image();
            image.src = e.target.result;
            image.alt = 'Family Member';
            image.className = 'member-image'; // Set a class for styling the image size

            memberDiv.appendChild(image);
            memberDiv.innerHTML += `<p>${name}<br>Memories: ${memories}</p>`;
            document.querySelector('.tree-container').appendChild(memberDiv);

            // Clear the form fields
            document.getElementById('member-name').value = '';
            document.getElementById('member-memories').value = '';
            document.getElementById('member-image').value = '';

            // Hide the form again
            document.getElementById('add-member-form').style.display = 'none';
        };
        reader.readAsDataURL(imageFile);
    } else {
        alert('Please fill in all fields and select an image.');
    }
}


