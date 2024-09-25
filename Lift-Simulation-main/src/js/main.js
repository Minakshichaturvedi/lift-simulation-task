document.addEventListener("DOMContentLoaded", () => {
    const submitBtn = document.querySelector("#submit-btn");
    const Container = document.getElementById("container");

    let floors = 0;
    let lifts = 0;
    let liftState = [];  // Array to track lift state
    let requestQueue = [];  // Queue to store lift requests
    let floorsWithRequests = {}; // Track if a lift is already assigned to a floor

    // Event listener for the Start Simulation button
    submitBtn.addEventListener("click", () => {
        const floorInput = document.querySelector(".Floor-Input").value;
        const liftInput = document.querySelector(".Lift-Input").value;

        floors = parseInt(floorInput);
        lifts = parseInt(liftInput);

        if (!floorInput || !liftInput || floors < 1 || lifts < 1) {
            alert('Please enter valid values for floors and lifts.');
        } else {
            startSimulation(floors, lifts);
        }
    });

    // Initialize the simulation
    function startSimulation(floorCount, liftCount) {
        Container.innerHTML = ""; // Clear the container before adding elements
        liftState = Array.from({ length: liftCount }, (_, index) => ({
            currentFloor: 0,
            busy: false,
            index: index
        }));
        floorsWithRequests = {}; // Reset tracking for floors with lift requests
        const liftWidth = 80;
        const floorWidth = (liftCount * (liftWidth + 20)) + 240;

        // Create floors
        for (let i = 0; i < floorCount; i++) {
            const floorDiv = document.createElement("div");
            floorDiv.classList.add("floor");
            floorDiv.style.width = `${floorWidth}px`;
            floorDiv.innerHTML = `
                <div class="floor-number">Floor ${i}</div>
                <button class="working-btn working-btn--up" ${i === floorCount - 1 ? 'disabled' : ''}>Up</button>
                <button class="working-btn working-btn--down" ${i === 0 ? 'disabled' : ''}>Down</button>
            `;
            Container.appendChild(floorDiv);
        }

        // Create lifts and place them at the ground floor
        for (let j = 0; j < liftCount; j++) {
            const lift = document.createElement("div");
            lift.classList.add("lift");
            lift.style.position = "absolute";
            lift.style.left = `${j * 100 + 240}px`;
            lift.innerHTML = `
                <div class="left-lift-door"></div>
                <div class="right-lift-door"></div>
            `;
            Container.appendChild(lift);
        }

        // Attach event listeners to buttons
        attachButtonListeners();
    }

    // Attach listeners to floor buttons (Up/Down)
    function attachButtonListeners() {
        const upButtons = document.querySelectorAll(".working-btn--up");
        const downButtons = document.querySelectorAll(".working-btn--down");

        upButtons.forEach((button, index) => {
            button.addEventListener("click", () => LiftCall(index, "up"));
        });

        downButtons.forEach((button, index) => {
            button.addEventListener("click", () => LiftCall(index, "down"));
        });
    }

    // Handle the lift call
    function LiftCall(floorIndex, direction) {
        // Check if a lift is already moving to this floor
        if (floorsWithRequests[floorIndex]) {
            console.log(`A lift is already heading to floor ${floorIndex}`);
            return; // Do nothing if a lift is already moving to this floor
        }

        // Find the nearest free lift
        const freeLift = findNearestFreeLift(floorIndex);

        if (freeLift !== null) {
            floorsWithRequests[floorIndex] = true; // Mark this floor as having a request
            moveLift(freeLift.index, floorIndex);
        } else {
            // If no lift is available, add the request to the queue
            requestQueue.push({ floorIndex, direction });
            console.log("Request queued for floor: " + floorIndex);
        }
    }

    // Find the nearest free lift
    function findNearestFreeLift(floorIndex) {
        let nearestLift = null;
        let minimumDistance = Infinity;

        // Check all lifts and find the nearest one that is not busy
        for (let i = 0; i < liftState.length; i++) {
            const lift = liftState[i];

            if (!lift.busy) {
                const distance = Math.abs(lift.currentFloor - floorIndex);
                if (distance < minimumDistance) {
                    minimumDistance = distance;
                    nearestLift = lift;
                }
            }
        }
        return nearestLift;
    }

    // Move the lift to the requested floor
    function moveLift(liftIndex, targetFloor) {
        const lift = liftState[liftIndex];
        lift.busy = true;  // Mark lift as busy

        const distance = Math.abs(lift.currentFloor - targetFloor);
        const moveDuration = distance * 2000; // Assuming 2 seconds per floor

        const liftElement = document.querySelectorAll('.lift')[liftIndex];
        liftElement.style.transition = `transform ${moveDuration}ms ease-in-out`;

        liftElement.style.transform = `translateY(${-targetFloor * 100}px)`;

        // Wait for the lift to reach the floor
        setTimeout(() => {
            openDoors(liftIndex);

            // After doors close, set lift as free and process the next request
            setTimeout(() => {
                lift.busy = false;
                lift.currentFloor = targetFloor;
                delete floorsWithRequests[targetFloor]; // Lift has reached, remove the request from tracking
                processQueue();  // Process the next request in the queue
            }, 2500); // Door closing delay
        }, moveDuration);
    }

    // Open the lift doors
    function openDoors(liftIndex) {
        const liftElement = document.querySelectorAll('.lift')[liftIndex];
        const leftDoor = liftElement.querySelector('.left-lift-door');
        const rightDoor = liftElement.querySelector('.right-lift-door');

        leftDoor.classList.add('left-lift-door-open');
        rightDoor.classList.add('right-lift-door-open');

        setTimeout(() => {
            leftDoor.classList.remove('left-lift-door-open');
            rightDoor.classList.remove('right-lift-door-open');
        }, 2500);  // Doors stay open for 2.5 seconds
    }

    // Process the next request in the queue
    function processQueue() {
        if (requestQueue.length > 0) {
            const nextRequest = requestQueue.shift();
            LiftCall(nextRequest.floorIndex, nextRequest.direction);
        }
    }
});
