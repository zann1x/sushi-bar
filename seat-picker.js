class SeatPicker {
    EMPTY = "-";
    seats = [];
    uniqueGroupId = -1;
    numberOfGuests = -1;

    constructor(numberOfSeats) {
        this.seats = new Array(numberOfSeats);
        for (var i = 0; i < numberOfSeats; ++i) {
            this.seats[i] = this.EMPTY;
        }
        this.uniqueGroupId = 0;
        this.numberOfGuests = 0;

        $("#numberOfSeats").prop("placeholder", "Currently: " + this.seats.length);
        $("#guestTable").text(this.seats);
    }

    addGuests(groupSize) {
        $("#formNewGuestsFeedback").text("");

        if (groupSize == "") {
            return;
        } else if (isNaN(groupSize)) {
            $("#formNewGuestsFeedback").text("Only numbers are allowed.");
            return;
        }

        // Check the boundaries
        if (groupSize <= 0) {
            $("#formNewGuestsFeedback").text("Only positive numbers are allowed.");
            return;
        } else if (groupSize > this.seats.length) {
            $("#formNewGuestsFeedback").text("The group is too big for this restaurant.");
            return;
        }

        if(groupSize > this.seats.length - this.numberOfGuests) {
            $("#formNewGuestsFeedback").text("Not enough free seats available.");
            return;
        }

        // Look for free seats available for this group and get the indices of the most suitable ones in a row
        var seatNumbers = this.findBestFreeSeats(groupSize);
        if (seatNumbers == null) {
            $("#formNewGuestsFeedback").text("No suitable seats were found.");
            return;
        }

        // Set the group id for the selected seats
        ++this.uniqueGroupId;
        for(var i = 0; i < groupSize; ++i) {
            this.seats[seatNumbers[i]] = this.uniqueGroupId;
        }
        this.numberOfGuests += parseInt(groupSize, 10);

        $("#guestTable").text(sp.seats);
    }

    removeGuestGroup(uniqueGroupId) {
        $("#formLeavingGuestsFeedback").text("");

        if (uniqueGroupId == "") {
            return;
        } else if (isNaN(uniqueGroupId)) {
            $("#formLeavingGuestsFeedback").text("Only numbers are allowed.");
            return;
        }

        // Check boundaries
        if (uniqueGroupId <= 0) {
            $("#formLeavingGuestsFeedback").text("The group id needs to be greater than 0.");
            return;
        } else if (uniqueGroupId > this.uniqueGroupId) {
            $("#formLeavingGuestsFeedback").text("No group with id " + uniqueGroupId + " found.");
            return;
        }

        // Check if the supplied group exists
        if (this.seats.findIndex(element => element == uniqueGroupId) == -1) {
            $("#formLeavingGuestsFeedback").text("No group with id " + uniqueGroupId + " is currently at the restaurant.");
            return;
        }

        // Clear the seats of the leaving group
        for(var i = 0; i < this.seats.length; ++i) {
            if (this.seats[i] == uniqueGroupId) {
                this.seats[i] = this.EMPTY;
                --this.numberOfGuests;
            }
        }

        $("#guestTable").text(sp.seats);
    }

    findBestFreeSeats(groupSize) {
        var availableSeats = [];
    
        // All seats are empty, so return all of them
        if (this.seats.findIndex(element => element != this.EMPTY) == -1) {
            for (var i = 0; i < this.seats.length; ++i) {
                availableSeats.push(i);
            }
            return availableSeats;
        }

        // Get an array of arrays of indices of free seats in a row.
        // Rows with more free seats in a row are further at the back of the array.
        availableSeats = this.findAllFreeSeatsInARow();
        if (availableSeats == null) {
            return null;
        }

        // Remove seat rows that do not suffice the group's size
        for (var i = 0; i < availableSeats.length; ++i) {
            if (availableSeats[i].length < groupSize) {
                availableSeats.splice(i, 1);
                --i;
            }
        }
        if (availableSeats.length == 0) {
            return null;
        }

        return this.pickFreeSeatRow(groupSize, availableSeats);
    }

    findAllFreeSeatsInARow() {        
        var availableSeats = [];
        var nextSeatIndex = 0;

        // At least one free seat should be available
        if (this.seats.findIndex(element => element == this.EMPTY) == -1) {
            return null;
        }

        // Go to the start index of an empty row of seats
        if (this.seats[nextSeatIndex] == this.EMPTY) {
            do {
                nextSeatIndex = this.decrementSeatIndex(nextSeatIndex);
            } while (this.seats[nextSeatIndex] == this.EMPTY);
            // The index is now on the last taken seat, so we have to increment it by one
            nextSeatIndex = this.incrementSeatIndex(nextSeatIndex);
        } else {
            do {
                nextSeatIndex = this.incrementSeatIndex(nextSeatIndex);
            } while (this.seats[nextSeatIndex] != this.EMPTY);
        }

        var startIndex = nextSeatIndex;
        do {
            // Store the indices of free seats in a row
            var seatsInQuestion = [];
            while (this.seats[nextSeatIndex] == this.EMPTY) {
                seatsInQuestion.push(nextSeatIndex);
                nextSeatIndex = this.incrementSeatIndex(nextSeatIndex);
            }

            if (availableSeats.length == 0) {
                availableSeats.push(seatsInQuestion);
            } else {
                // Put parts that have less seats in a row available at the front of the array
                if (seatsInQuestion.length <= availableSeats[0].length) {
                    availableSeats.unshift(seatsInQuestion);
                } else {
                    availableSeats.push(seatsInQuestion);
                }
            }

            // Find the next empty seat
            while (this.seats[nextSeatIndex] != this.EMPTY) {
                nextSeatIndex = this.incrementSeatIndex(nextSeatIndex);
            }
        } while (nextSeatIndex != startIndex);

        return availableSeats;
    }

    pickFreeSeatRow(groupSize, availableSeats) {
        var pickedRowIndex = -1;
        var isPickLeftAligned = true;

        {
            // Pick the seat row that is sizewise closest to the group and that is closest to the highest group id
            var highestGroupId = -1;
            var lowestSeatRowLength = availableSeats[0].length;
            for (var i = 0; i < availableSeats.length; ++i) {
                // Only look at seat rows that are the closest to the group's size
                if (availableSeats[i].length != lowestSeatRowLength) {
                    break;
                }

                // Determine the group id on both sides of the current seat row
                var currentRow = availableSeats[i];
                var leftGroupId = this.seats[this.decrementSeatIndex(currentRow[0])];
                var rightGroupId = this.seats[this.incrementSeatIndex(currentRow[currentRow.length - 1])];

                // Pick the group id that is higher so the group is placed next to another group that will still spend
                // about the same amount of time in the restaurant. Groups that are still in the restaurant are therefore
                // more or less tightly packed together and give more room to bigger groups possibly coming in the future.
                var currentHighestGroupId = -1;
                if (rightGroupId > leftGroupId) {
                    currentHighestGroupId = rightGroupId;
                    isPickLeftAligned = false;
                } else {
                    currentHighestGroupId = leftGroupId;
                    isPickLeftAligned = true;
                }

                if (currentHighestGroupId > highestGroupId) {
                    highestGroupId = currentHighestGroupId;
                    pickedRowIndex = i;
                }
            }
        }

        // Depending on which side the group should be placed closer to, the seat indices are cut so that
        // only the seats that the group should be placed at are left in the array.
        var deleteCount = availableSeats[pickedRowIndex].length - groupSize;
        if (!isPickLeftAligned) {
            availableSeats[pickedRowIndex].splice(0, deleteCount);
        } else {
            availableSeats[pickedRowIndex].splice(groupSize, deleteCount);
        }

        return availableSeats[pickedRowIndex];
    }

    incrementSeatIndex(seatIndex) {
        return (seatIndex + 1) % this.seats.length;
    }

    decrementSeatIndex(seatIndex) {
        // All props for this syntax go to a javascript modulo bug with negative numbers
        // (see https://web.archive.org/web/20090717035140if_/javascript.about.com/od/problemsolving/a/modulobug.htm)
        var index = seatIndex - 1;
        return ((index % this.seats.length) + this.seats.length) % this.seats.length;
    }
}
