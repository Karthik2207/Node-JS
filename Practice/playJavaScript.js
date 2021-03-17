const username = 'Max';
let age = 29;
const hasHobbies = true;

age = 30;

// function summarizeUser(userName, userAge, userHasHobby) {
//   return (
//     'Name is ' +
//     userName +
//     ', age is ' +
//     userAge +
//     ' and the user has hobbies: ' +
//     userHasHobby
//   );
// }
const summarizeUser = (userName, userAge, userHasHobby) => {
  return (
    'Name is ' +
    userName +
    ', age is ' +
    userAge +
    ' and the user has hobbies: ' +
    userHasHobby
  );
};

console.log(summarizeUser(username, age, hasHobbies));

const person = {
  name: 'Max',
  age: 29,
  greet() {
    console.log('Hi, I am ' + this.name);
  }
};

person.greet();

const hobbies = ['Sports', 'Cooking'];
hobbies.push('Programming');
for (let hobby of hobbies) {
  console.log(hobby);
}
console.log(hobbies.map(hobby => 'Hobby: ' + hobby));

//Spread Operator
const copiedArray = [...hobbies];
console.log(copiedArray);