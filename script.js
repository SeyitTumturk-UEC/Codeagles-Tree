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
                // Connect siblings to each other and to their common parent
                existingMember.siblings.forEach(siblingId => {
                    const sibling = this.members.get(siblingId);
                    if (sibling) {
                        sibling.siblings.push(newMember.id);
                        newMember.siblings.push(sibling.id);
                    }
                });
                existingMember.siblings.push(newMember.id);
                newMember.siblings.push(existingMember.id);

                // Connect new sibling to the parents of the existing sibling
                existingMember.parents.forEach(parentId => {
                    const parent = this.members.get(parentId);
                    if (parent) {
                        parent.children.push(newMember.id);
                        newMember.parents.push(parent.id);
                    }
                });
                break;
        }
    }

    // Handle form submission
    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(e.target);
        const member = new FamilyMember(
            formData.get('name'),
            formData.get('birthDate'),
            formData.get('location'),
            formData.get('notes')
        );

        if (!this.selectedRelation) {
            alert('Please select a relationship type');
            return;
        }

        this.addMember(member, this.selectedRelation, this.selectedMemberId);
        this.closeModal();
        e.target.reset();
        this.selectedRelation = null;
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

        // Create horizontal container for the member and its siblings
        const memberHorizontalContainer = document.createElement('div');
        memberHorizontalContainer.className = 'horizontal-container';
        memberWrapper.appendChild(memberHorizontalContainer);

        // Add the main member card
        const memberCard = this.createMemberCard(member, level);
        memberHorizontalContainer.appendChild(memberCard);

        // Handle siblings at this level
        member.siblings.forEach(siblingId => {
            const sibling = this.members.get(siblingId);
            if (sibling && !renderedMembers.has(siblingId)) {
                const siblingWrapper = document.createElement('div');
                siblingWrapper.className = 'member-wrapper';
                
                const siblingCard = this.createMemberCard(sibling, level, true);
                siblingWrapper.appendChild(siblingCard);
                
                // Handle children of siblings
                if (sibling.children.length > 0) {
                    const siblingChildrenContainer = document.createElement('div');
                    siblingChildrenContainer.className = 'children-container';
                    
                    const siblingChildrenHorizontalContainer = document.createElement('div');
                    siblingChildrenHorizontalContainer.className = 'horizontal-container';
                    siblingChildrenContainer.appendChild(siblingChildrenHorizontalContainer);

                    sibling.children.forEach(childId => {
                        const child = this.members.get(childId);
                        if (child && !renderedMembers.has(childId)) {
                            const childMember = this.renderMember(child, siblingChildrenHorizontalContainer, level + 1, renderedMembers);
                            if (childMember) {
                                siblingChildrenHorizontalContainer.appendChild(childMember);
                            }
                        }
                    });
                    
                    siblingWrapper.appendChild(siblingChildrenContainer);
                }
                
                memberHorizontalContainer.appendChild(siblingWrapper);
                renderedMembers.add(siblingId);
            }
        });

        // Handle children
        if (member.children.length > 0) {
            const childrenContainer = document.createElement('div');
            childrenContainer.className = 'children-container';
            
            const childrenHorizontalContainer = document.createElement('div');
            childrenHorizontalContainer.className = 'horizontal-container';
            childrenContainer.appendChild(childrenHorizontalContainer);

            // Render all children at this level horizontally
            member.children.forEach(childId => {
                const child = this.members.get(childId);
                if (child && !renderedMembers.has(childId)) {
                    const childMember = this.renderMember(child, childrenHorizontalContainer, level + 1, renderedMembers);
                    if (childMember) {
                        childrenHorizontalContainer.appendChild(childMember);
                    }
                }
            });

            memberWrapper.appendChild(childrenContainer);
        }

        return memberWrapper;
    }

    // New helper method to create member cards
    createMemberCard(member, level, isSibling = false) {
        const card = document.createElement('div');
        card.className = `member-card${isSibling ? ' sibling' : ''}`;
        card.innerHTML = `
            <h3>${member.name}</h3>
            <p>Birth Date: ${new Date(member.birthDate).toLocaleDateString()}</p>
            <p>Location: ${member.location}</p>
            <p>Notes: ${member.notes}</p>
            <button class="add-member-btn">+</button>
        `;
        card.dataset.id = member.id;
        card.dataset.level = level;

        // Add member button click handler
        card.querySelector('.add-member-btn').addEventListener('click', () => {
            this.selectedMemberId = member.id;
            this.openModal();
        });

        return card;
    }

    // Render empty root node
    renderEmptyRoot(container) {
        const emptyRoot = document.createElement('div');
        emptyRoot.className = 'member-card empty-root';
        emptyRoot.innerHTML = `
            <p>Start Your Family Tree</p>
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

        // Get positions relative to the viewport and account for scale
        const viewportRect = this.viewport.getBoundingClientRect();
        const fromRect = fromCard.getBoundingClientRect();
        const toRect = toCard.getBoundingClientRect();

        // Calculate positions accounting for scale and transform
        const startX = ((fromRect.left + fromRect.width / 2) - viewportRect.left) / this.scale;
        const startY = (fromRect.bottom - viewportRect.top) / this.scale;
        const endX = ((toRect.left + toRect.width / 2) - viewportRect.left) / this.scale;
        const endY = (toRect.top - viewportRect.top) / this.scale;

        // Create curved path with scaled coordinates
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const controlX1 = startX + deltaX / 4;
        const controlY1 = startY + deltaY / 2;
        const controlX2 = startX + 3 * deltaX / 4;
        const controlY2 = startY + deltaY / 2;

        const pathD = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;

        // Create glow effect
        const glowPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
        glowPath.classList.add('glow-path');
        glowPath.setAttribute("d", pathD);
        svg.appendChild(glowPath);

        // Create main path
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.classList.add('connection-path');
        path.setAttribute("d", pathD);
        svg.appendChild(path);

        svgContainer.appendChild(svg);
    }

    // New method to create connections after rendering
    createConnections() {
        this.members.forEach(member => {
            const memberCard = document.querySelector(`.member-card[data-id='${member.id}']`);
            
            // Create parent-child connections
            member.children.forEach(childId => {
                const childCard = document.querySelector(`.member-card[data-id='${childId}']`);
                if (memberCard && childCard) {
                    this.createCurvedConnection(memberCard, childCard);
                }
            });

            // Create parent-sibling connections
            if (member.parents.length > 0) {
                member.parents.forEach(parentId => {
                    const parentCard = document.querySelector(`.member-card[data-id='${parentId}']`);
                    if (parentCard && memberCard) {
                        this.createCurvedConnection(parentCard, memberCard);
                    }
                });
            }
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
}

// Initialize the family tree
const familyTree = new FamilyTree();
familyTree.renderTree(); 