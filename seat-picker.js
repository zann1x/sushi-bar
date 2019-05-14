class SeatPicker {
    EMPTY = -1;
    seats = [];
    uniqueGroupId = -1;
    numberOfGuests = -1;

    constructor(numberOfSeats) {
        this.seats = new Array(numberOfSeats);
        for (var i = 0; i < numberOfSeats; ++i) {
            this.seats[i] = this.EMPTY;
        }
        this.uniqueGroupId = -1;
        this.numberOfGuests = 0;

        console.log(this);
    }

    addGuests(groupSize) {
        // Check the boundaries
        if (groupSize <= 0) {
            console.log("Only positive numbers are allowed. (addGuests)");
            return;
        } else if (groupSize > this.seats.length) {
            console.log("The group is too big for this restaurant. (addGuests)");
            return;
        }

        if(groupSize > this.seats.length - this.numberOfGuests) {
            console.log("Not enough free seats available. (addGuests)");
            return;
        }

        // Look for free seats available for this group and get the indices of the most suitable ones in a row
        var seatNumbers = this.findBestFreeSeats(groupSize);
        if (seatNumbers == null) {
            console.log("No findBestFreeSeats seat numbers were found. (addGuests)");
            return;
        }

        // Set the group id for the selected seats
        ++this.uniqueGroupId;
        for(var i = 0; i < groupSize; ++i) {
            this.seats[seatNumbers[i]] = this.uniqueGroupId;
        }
        this.numberOfGuests += parseInt(groupSize, 10);

        console.log(this);
    }

    removeGuestGroup(uniqueGroupId) {
        // Check boundaries
        if (uniqueGroupId < 0) {
            console.log("Group Ids need to be >= 0. (removeGuestGroup)");
            return;
        } else if (uniqueGroupId > this.uniqueGroupId) {
            console.log("No group with id " + uniqueGroupId + " found. (removeGuestGroup)");
            return;
        }

        // Check if the supplied group exists
        if (this.seats.findIndex(element => element == uniqueGroupId) == -1) {
            console.log("No group with id " + uniqueGroupId + " found. (removeGuestGroup)");
            return;
        }

        // Clear the seats of the leaving group
        for(var i = 0; i < this.seats.length; ++i) {
            if (this.seats[i] == uniqueGroupId) {
                this.seats[i] = this.EMPTY;
                --this.numberOfGuests;
            }
        }

        console.log(this);
    }

    findBestFreeSeats(groupSize) {
        var availableSeats = [];
    
        // If the seat array is completely empty, an array with all seats is returned
        if (this.seats.findIndex(element => element != this.EMPTY) == -1) {
            for (var i = 0; i < this.seats.length; ++i) {
                availableSeats.push(i);
            }
            return availableSeats;
        }

        availableSeats = this.findAllFreeSeatsInARow();
        if (availableSeats == null) {
            console.log("Not enough seats in a row available! (findBestFreeSeats)");
            return null;
        } else if (availableSeats[0].length < groupSize) {
            console.log("Not enough free seats in a row available for this group! (findBestFreeSeats)");
            return null;
        }

        return this.pickFreeSeatRow(groupSize, availableSeats);
    }

    findAllFreeSeatsInARow() {        
        var availableSeats = [];
        var nextSeatIndex = 0;

        // Go to the start index of an empty row of seats
        if (this.seats[nextSeatIndex] == this.EMPTY) {
            do {
                nextSeatIndex = this.decrementSeatIndex(nextSeatIndex);
            } while (this.seats[nextSeatIndex] == this.EMPTY);
            // The index is on the last taken seat, so we have to increment it by one
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
                // Put parts that have more seats in a row available at the front of the array
                if (seatsInQuestion.length >= availableSeats[0].length) {
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
        var lowestDistance = Number.MAX_SAFE_INTEGER;
        var indexOfLowestDistance = -1;

        // Pick the seat row that is sizewise closest to the group.
        // TODO: pick the row that is additionally closest to the highest group id ?
        for (var i = 0; i < availableSeats.length; ++i) {
            var distance = availableSeats[i].length - groupSize;

            if (distance == 0) {
                return availableSeats[i];
            } else if (distance < 0) {
                return availableSeats[i - 1];
            } else if (distance < lowestDistance) {
                lowestDistance = distance;
                indexOfLowestDistance = i;
            }
        }

        return availableSeats[indexOfLowestDistance];
    }

    incrementSeatIndex(seatIndex) {
        return (seatIndex + 1) % this.seats.length;
    }

    decrementSeatIndex(seatIndex) {
        var index = seatIndex - 1;
        // All props for this syntax go to a javascript modulo bug with negative numbers
        // (see https://web.archive.org/web/20090717035140if_/javascript.about.com/od/problemsolving/a/modulobug.htm)
        return ((index % this.seats.length) + this.seats.length) % this.seats.length;
    }
}
