// Family Member Class
class FamilyMember {
    constructor(name, birthDate, location, notes) {
        this.id = Date.now(); // Unique ID for each member
        this.name = name;
        this.birthDate = birthDate;
        this.location = location;
        this.notes = notes;
        this.children = [];
        this.parents = [];
        this.siblings = [];
    }
}

// Family Tree Class
class FamilyTree {
    constructor() {
        this.members = new Map();
        this.rootMember = null;
        this.initializeEventListeners();
        window.addEventListener('resize', () => {
            this.renderTree();
        });
        this.scale = 1;
        this.panning = false;
        this.startPoint = { x: 0, y: 0 };
        this.pointNow = { x: 0, y: 0 };
        this.initializeZoomPan();
    }

    // Initialize event listeners for the application
    initializeEventListeners() {
        const form = document.getElementById('member-form');
        form.addEventListener('submit', (e) => this.handleFormSubmit(e));

        // Relationship button listeners
        document.querySelectorAll('.relationship-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                // Remove active class from all buttons
                document.querySelectorAll('.relationship-btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                
                // Add active class to clicked button
                e.target.classList.add('active');
                this.selectedRelation = e.target.dataset.relation;
            });
        });
    }

    // Add a new family member
    addMember(member, relation, relatedToId) {
        this.members.set(member.id, member);

        if (!this.rootMember) {
            this.rootMember = member;
        } else if (relatedToId) {
            const relatedMember = this.members.get(relatedToId);
            this.createRelationship(member, relatedMember, relation);
        }

        this.renderTree();
        
        // Ensure connections are created after the DOM is updated
        requestAnimationFrame(() => {
            this.createConnections();
        });
    }

    // Create relationship between family members
    createRelationship(newMember, existingMember, relation) {
        switch (relation) {
            case 'child':
                existingMember.children.push(newMember.id);
                newMember.parents.push(existingMember.id);
                break;
            case 'parent':
                newMember.children.push(existingMember.id);
                existingMember.parents.push(newMember.id);
                break;
            case 'sibling':
                // First, find the parent of the existing sibling
                const parentId = existingMember.parents[0];
                if (parentId) {
                    const parent = this.members.get(parentId);
                    if (parent) {
                        // Add new member as a child of the parent
                        parent.children.push(newMember.id);
                        newMember.parents.push(parentId);
                    }
                }

                // Connect siblings to each other
                existingMember.siblings.push(newMember.id);
                newMember.siblings.push(existingMember.id);
                
                // Connect to other existing siblings
                existingMember.siblings.forEach(siblingId => {
                    if (siblingId !== newMember.id) {
                        const sibling = this.members.get(siblingId);
                        if (sibling) {
                            sibling.siblings.push(newMember.id);
                            newMember.siblings.push(sibling.id);
                        }
                    }
                });
                break;
        }
    }

    // Handle form submission
    handleFormSubmit(e) {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const birthDate = document.getElementById('birthDate').value;
        const location = document.getElementById('location').value;
        const notes = document.getElementById('notes').value;
        const photoInput = document.getElementById('photo');
        
        // Handle photo upload
        const file = photoInput.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const member = new FamilyMember(
                    name,
                    birthDate,
                    location,
                    notes
                );
                member.photoUrl = e.target.result;

                if (!this.selectedRelation) {
                    alert('Please select a relationship type');
                    return;
                }

                this.addMember(member, this.selectedRelation, this.selectedMemberId);
                this.closeModal();
                photoInput.value = '';
                document.getElementById('member-form').reset();
                this.selectedRelation = null;
            };
            reader.readAsDataURL(file);
        } else {
            const member = new FamilyMember(
                name,
                birthDate,
                location,
                notes
            );
            
            if (!this.selectedRelation) {
                alert('Please select a relationship type');
                return;
            }

            this.addMember(member, this.selectedRelation, this.selectedMemberId);
            this.closeModal();
            document.getElementById('member-form').reset();
            this.selectedRelation = null;
        }
    }

    // Render the family tree
    renderTree() {
        const treeContainer = document.getElementById('family-tree');
        treeContainer.innerHTML = '';
        
        if (this.rootMember) {
            const rootWrapper = this.renderMember(this.rootMember, treeContainer, 0, new Set());
            if (rootWrapper) {
                treeContainer.appendChild(rootWrapper);
            }
            
            // Create connections after a short delay to ensure DOM is updated
            requestAnimationFrame(() => {
                this.createConnections();
            });
        } else {
            this.renderEmptyRoot(treeContainer);
        }
    }

    // Render individual family member
    renderMember(member, container, level, renderedMembers = new Set()) {
        if (renderedMembers.has(member.id)) {
            return null;
        }
        renderedMembers.add(member.id);

        const memberWrapper = document.createElement('div');
        memberWrapper.className = 'member-wrapper';
        memberWrapper.dataset.level = level;

        // Create horizontal container for the member and its siblings
        const memberHorizontalContainer = document.createElement('div');
        memberHorizontalContainer.className = 'horizontal-container';
        memberHorizontalContainer.dataset.level = level;
        memberWrapper.appendChild(memberHorizontalContainer);

        // Add the main member card
        const memberCard = this.createMemberCard(member, level);
        const cardWrapper = document.createElement('div');
        cardWrapper.className = 'card-wrapper';
        cardWrapper.appendChild(memberCard);
        memberHorizontalContainer.appendChild(cardWrapper);

        // Create a container for all children at this generation level
        const generationContainer = document.createElement('div');
        generationContainer.className = 'generation-container';
        generationContainer.dataset.level = level + 1;

        // Collect all children from member and siblings
        const allChildren = new Map();
        
        // Add member's children first to maintain order
        member.children.forEach(childId => {
            if (!renderedMembers.has(childId)) {
                allChildren.set(childId, {
                    child: this.members.get(childId),
                    parentId: member.id
                });
            }
        });

        // Handle siblings and their children
        member.siblings.forEach(siblingId => {
            const sibling = this.members.get(siblingId);
            if (sibling && !renderedMembers.has(siblingId)) {
                const siblingCard = this.createMemberCard(sibling, level, true);
                const siblingCardWrapper = document.createElement('div');
                siblingCardWrapper.className = 'card-wrapper';
                siblingCardWrapper.appendChild(siblingCard);
                memberHorizontalContainer.appendChild(siblingCardWrapper);
                renderedMembers.add(siblingId);

                // Add sibling's children to the map
                sibling.children.forEach(childId => {
                    if (!renderedMembers.has(childId)) {
                        allChildren.set(childId, {
                            child: this.members.get(childId),
                            parentId: siblingId
                        });
                    }
                });
            }
        });

        // Update the sorting of children to maintain parent alignment
        if (allChildren.size > 0) {
            const sortedChildren = Array.from(allChildren.entries()).sort((a, b) => {
                const parentA = this.members.get(a[1].parentId);
                const parentB = this.members.get(b[1].parentId);
                
                // Get the horizontal position of parents in the DOM
                const parentACard = document.querySelector(`.member-card[data-id='${parentA.id}']`);
                const parentBCard = document.querySelector(`.member-card[data-id='${parentB.id}']`);
                
                if (parentACard && parentBCard) {
                    // Compare parent positions to maintain alignment
                    const rectA = parentACard.getBoundingClientRect();
                    const rectB = parentBCard.getBoundingClientRect();
                    return rectA.left - rectB.left;
                }
                
                // Fallback to previous sorting if elements not found
                if (a[1].parentId === member.id && b[1].parentId !== member.id) return -1;
                if (a[1].parentId !== member.id && b[1].parentId === member.id) return 1;
                return a[0] - b[0];
            });

            // Create a map to group children by their parent
            const childrenByParent = new Map();
            sortedChildren.forEach(([childId, {child, parentId}]) => {
                if (!childrenByParent.has(parentId)) {
                    childrenByParent.set(parentId, []);
                }
                childrenByParent.get(parentId).push(child);
            });

            // Create separate containers for each parent's children
            childrenByParent.forEach((children, parentId) => {
                const parentChildrenContainer = document.createElement('div');
                parentChildrenContainer.className = 'parent-children-group';
                parentChildrenContainer.dataset.parentId = parentId;
                
                children.forEach(child => {
                    if (!renderedMembers.has(child.id)) {
                        const childMember = this.renderMember(child, parentChildrenContainer, level + 1, renderedMembers);
                        if (childMember) {
                            parentChildrenContainer.appendChild(childMember);
                        }
                    }
                });
                
                generationContainer.appendChild(parentChildrenContainer);
            });

            memberWrapper.appendChild(generationContainer);
        }

        return memberWrapper;
    }

    // New helper method to create member cards
    createMemberCard(member, level, isSibling = false) {
        const card = document.createElement('div');
        card.className = `member-card${isSibling ? ' sibling' : ''}`;
        
        // Default avatar if no image uploaded
        const defaultAvatar = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%236b46c1'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E`;
        
        card.innerHTML = `
            <div class="member-name-container">
                <span class="member-name">${member.name}</span>
            </div>
            <div class="member-image-container">
                <img src="${member.photoUrl || defaultAvatar}" alt="${member.name}" class="member-photo">
            </div>
            <div class="quick-info">
                <p><strong>${member.name}</strong></p>
                <p>Born: ${new Date(member.birthDate).toLocaleDateString()}</p>
                <p>${member.location || 'Location unknown'}</p>
            </div>
            <button class="add-member-btn">+</button>
        `;
        
        card.dataset.id = member.id;
        card.dataset.level = level;

        // Add member button click handler
        card.querySelector('.add-member-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectedMemberId = member.id;
            this.openModal();
        });

        // Add click handler for info modal
        card.addEventListener('click', () => {
            this.openInfoModal(member);
        });

        return card;
    }

    // Render empty root node
    renderEmptyRoot(container) {
        const emptyRoot = document.createElement('div');
        emptyRoot.className = 'member-card empty-root';
        emptyRoot.innerHTML = `
            <p>Root</p>
            <button class="add-member-btn">+</button>
        `;

        const wrapper = document.createElement('div');
        wrapper.className = 'member-wrapper';
        wrapper.appendChild(emptyRoot);
        container.appendChild(wrapper);

        emptyRoot.querySelector('.add-member-btn').addEventListener('click', () => {
            this.openModal();
        });
    }

    // Modal controls
    openModal() {
        document.getElementById('add-member-modal').style.display = 'block';
    }

    closeModal() {
        document.getElementById('add-member-modal').style.display = 'none';
    }

    // Add a new method to create curved connections
    createCurvedConnection(fromCard, toCard) {
        const connectionId = `connection-${fromCard.dataset.id}-${toCard.dataset.id}`;
        const existingLine = document.getElementById(connectionId);
        if (existingLine) {
            existingLine.remove();
        }

        let svgContainer = this.viewport.querySelector('.svg-container');
        if (!svgContainer) {
            svgContainer = document.createElement('div');
            svgContainer.className = 'svg-container';
            this.viewport.insertBefore(svgContainer, this.viewport.firstChild);
        }

        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("id", connectionId);
        svg.classList.add('connection-svg');
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.setAttribute("preserveAspectRatio", "none");

        // Get positions relative to the viewport and account for scale
        const viewportRect = this.viewport.getBoundingClientRect();
        const fromRect = fromCard.getBoundingClientRect();
        const toRect = toCard.getBoundingClientRect();
        
        // Get the name container of the target card
        const toNameContainer = toCard.querySelector('.member-name-container');
        const nameContainerRect = toNameContainer.getBoundingClientRect();

        // Calculate positions accounting for scale and transform
        const startX = ((fromRect.left + fromRect.width / 2) - viewportRect.left) / this.scale;
        const endX = ((toRect.left + toRect.width / 2) - viewportRect.left) / this.scale;
        
        // Start from the bottom of the first card
        const startY = (fromRect.bottom - viewportRect.top - 5) / this.scale;
        
        // End at the TOP of the name container
        const endY = (nameContainerRect.top - viewportRect.top) / this.scale;

        // Calculate control points for the curve
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Increase curve intensity for more noticeable curves
        const curveIntensity = Math.min(distance * 0.2, 50);  // Increased from 0.05 to 0.2, max from 10 to 50
        
        const pathD = `
            M ${startX} ${startY}
            C ${startX} ${startY + curveIntensity},
              ${endX} ${endY - curveIntensity},
              ${endX} ${endY}
        `;

        // Create glow effect
        const glowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        glowPath.classList.add('glow-path');
        glowPath.setAttribute("d", pathD);
        glowPath.setAttribute("vector-effect", "non-scaling-stroke");
        svg.appendChild(glowPath);

        // Create main path
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.classList.add('connection-path');
        path.setAttribute("d", pathD);
        path.setAttribute("vector-effect", "non-scaling-stroke");
        svg.appendChild(path);

        svgContainer.appendChild(svg);
    }

    // New method to create connections after rendering
    createConnections() {
        this.members.forEach(member => {
            const memberCard = document.querySelector(`.member-card[data-id='${member.id}']`);
            
            // Only create parent-child connections
            member.children.forEach(childId => {
                const childCard = document.querySelector(`.member-card[data-id='${childId}']`);
                if (memberCard && childCard) {
                    this.createCurvedConnection(memberCard, childCard);
                }
            });
        });
    }

    initializeZoomPan() {
        // Only wrap the family tree content in viewport
        const treeContainer = document.querySelector('.tree-container');
        const familyTree = document.querySelector('#family-tree');
        
        const viewport = document.createElement('div');
        viewport.className = 'viewport';
        
        // Only move the family tree into viewport
        viewport.appendChild(familyTree);
        treeContainer.appendChild(viewport);

        // Add zoom controls
        const zoomControls = document.createElement('div');
        zoomControls.className = 'zoom-controls';
        zoomControls.innerHTML = `
            <button class="zoom-btn zoom-in">+</button>
            <button class="zoom-btn zoom-out">-</button>
            <button class="zoom-btn zoom-reset">↺</button>
        `;
        document.body.appendChild(zoomControls);

        const scaleIndicator = document.createElement('div');
        scaleIndicator.className = 'scale-indicator';
        document.body.appendChild(scaleIndicator);

        this.viewport = viewport;
        this.scale = 1;
        this.pointNow = { x: 0, y: 0 };
        
        // Zoom controls
        document.querySelector('.zoom-in').addEventListener('click', () => this.zoom(0.1));
        document.querySelector('.zoom-out').addEventListener('click', () => this.zoom(-0.1));
        document.querySelector('.zoom-reset').addEventListener('click', () => this.resetZoom());

        // Mouse wheel zoom
        viewport.addEventListener('wheel', (e) => {
            e.preventDefault();
            
            const rect = viewport.getBoundingClientRect();
            const x = (e.clientX - rect.left) / this.scale;
            const y = (e.clientY - rect.top) / this.scale;
            
            const delta = e.deltaY > 0 ? -0.1 : 0.1;
            const newScale = this.scale + delta;
            
            if (newScale >= 0.1 && newScale <= 4) {
                this.pointNow.x -= x * (newScale - this.scale);
                this.pointNow.y -= y * (newScale - this.scale);
                this.scale = newScale;
                this.updateTransform();
            }
        });

        // Panning - attach to viewport instead of tree container
        viewport.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            e.preventDefault();
            this.panning = true;
            this.startPoint = { 
                x: e.clientX - this.pointNow.x * this.scale,
                y: e.clientY - this.pointNow.y * this.scale
            };
            viewport.style.cursor = 'grabbing';
        });

        document.addEventListener('mousemove', (e) => {
            if (!this.panning) return;
            e.preventDefault();
            this.pointNow = {
                x: (e.clientX - this.startPoint.x) / this.scale,
                y: (e.clientY - this.startPoint.y) / this.scale
            };
            this.updateTransform();
        });

        document.addEventListener('mouseup', () => {
            this.panning = false;
            viewport.style.cursor = 'grab';
        });
    }

    zoom(delta) {
        const newScale = this.scale + delta;
        if (newScale >= 0.5 && newScale <= 2) {
            this.scale = newScale;
            this.updateTransform();
        }
    }

    resetZoom() {
        this.scale = 1;
        this.pointNow = { x: 0, y: 0 };
        this.updateTransform();
    }

    updateTransform() {
        this.viewport.style.transform = `translate(${this.pointNow.x}px, ${this.pointNow.y}px) scale(${this.scale})`;
        
        const scaleIndicator = document.querySelector('.scale-indicator');
        scaleIndicator.textContent = `${Math.round(this.scale * 100)}%`;

        // Recalculate connections after transform
        requestAnimationFrame(() => {
            this.createConnections();
        });
    }

    // Add new method to handle info modal
    openInfoModal(member) {
        let infoModal = document.getElementById('info-modal');
        if (!infoModal) {
            infoModal = document.createElement('div');
            infoModal.id = 'info-modal';
            infoModal.className = 'info-modal';
            document.body.appendChild(infoModal);
        }

        const photoUrl = `https://i.pravatar.cc/300?u=${member.id}`;
        
        infoModal.innerHTML = `
            <div class="info-modal-content">
                <button class="close-modal-btn">&times;</button>
                <div class="info-modal-header">
                    <img src="${photoUrl}" alt="${member.name}" class="info-modal-photo">
                    <h2 class="info-modal-name">${member.name}</h2>
                </div>
                <div class="info-modal-details">
                    <p><strong>Birth Date:</strong> ${new Date(member.birthDate).toLocaleDateString()}</p>
                    <p><strong>Location:</strong> ${member.location || 'Unknown'}</p>
                    <p><strong>Notes:</strong> ${member.notes || 'No notes available'}</p>
                </div>
            </div>
        `;

        infoModal.style.display = 'block';

        // Close modal handlers
        const closeBtn = infoModal.querySelector('.close-modal-btn');
        closeBtn.addEventListener('click', () => {
            infoModal.style.display = 'none';
        });

        infoModal.addEventListener('click', (e) => {
            if (e.target === infoModal) {
                infoModal.style.display = 'none';
            }
        });
    }
}

// Initialize the family tree
const familyTree = new FamilyTree();
familyTree.renderTree(); 