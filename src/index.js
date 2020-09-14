import React, { Component } from 'react';
import { render } from 'react-dom';
import './index.css';
import TraitList from "./component/TraitList";
import AttributeList from './component/AttributeList';
import Field from './component/Field';

const roll8Plus2d3 = require('./utils/Dice').roll8Plus2d3;
const rollDie = require('./utils/Dice').rollDie;
const Origins = require('./data/Origins');
const Backgrounds = require('./data/Backgrounds');
const Professions = require('./data/Professions');
const Traits = require('./data/Traits');
const Names = require('./data/Names');

class DieRollerForm extends Component {
	constructor(props) {
		super(props);
		this.origins = new Origins();
		this.backgrounds = new Backgrounds();
		this.professions = new Professions();
		this.traits = new Traits();
		this.names = new Names();
		this.state = {
			name: "Nameless",
			level: 1,
			speed: 30,
			toughness: roll8Plus2d3(),
			currentHP: 1,
			accuracy: roll8Plus2d3(),
			athletics: roll8Plus2d3(),
			awareness: roll8Plus2d3(),
			education: roll8Plus2d3(),
			presence: roll8Plus2d3(),
			morale: roll8Plus2d3(),
			currentMorale: 1,
			origin: 'None',
			background: 'None',
			player: 'None',
			profession: 'None',
			traits: ['None'],
			attributes: []
		}
		
		this.doReroll = this.doReroll.bind(this);
		this.addLevel = this.addLevel.bind(this);
	}

	async setAttributeValue(attribute, value) {
		if (attribute === 'accuracy') {
			await this.setState({ accuracy: value });
		} else if (attribute === 'athletics') {
			await this.setState({ athletics: value });
		} else if (attribute === 'awareness') {
			await this.setState({ awareness: value });
		} else if (attribute === 'education') {
			await this.setState({ education: value });
		} else if (attribute === 'morale') {
			await this.setState({ morale: value });
		} else if (attribute === 'presence') {
			await this.setState({ presence: value });
		} else if (attribute === 'toughness') {
			await this.setState({ toughness: value });
		}
	}

	getAttributeValue(attribute) {
		if (attribute === 'accuracy') {
			return this.state.accuracy;
		} else if (attribute === 'athletics') {
			return this.state.athletics;
		} else if (attribute === 'awareness') {
			return this.state.awareness;
		} else if (attribute === 'education') {
			return this.state.education;
		} else if (attribute === 'morale') {
			return this.state.morale;
		} else if (attribute === 'presence') {
			return this.state.presence;
		} else if (attribute === 'toughness') {
			return this.state.toughness;
		}
	}

	compareTraits(a,b) {
		var traitNameA = a.name;
		if (typeof traitNameA === 'string') {
			traitNameA = traitNameA.toUpperCase();
		}
		var traitNameB = b.name;
		if (typeof traitNameB === 'string') {
			traitNameB = traitNameB.toUpperCase();
		}
		let comparison = 0;
		if (traitNameA > traitNameB) {
			comparison = 1;
		} else if (traitNameA < traitNameB) {
			comparison = -1;
		}
		return comparison;
	}

	async addLevel() {
		var currentLevel = this.state.level;
		var newLevel = currentLevel + 1;
		await this.setState({level: newLevel});
		console.log(`New Level = ${this.state.level}`);

		var currentTraits = this.state.traits;
		var newTrait = await this.traits.pickTrait();
		console.log(`new trait for level ${this.state.level} = ${JSON.stringify(newTrait)}`);
		var alreadyHasTrait = currentTraits.includes(newTrait.name);
		var traitIsOkToRepeat = this.traits.canRepeatTraits.includes(newTrait.name);
		var hasPrereqsForTrait = await this.traits.hasPrerequisites(newTrait, currentTraits);
		console.log(`Already has trait ${newTrait.name} = ${alreadyHasTrait}`);
		console.log(`Has prereqs for trait ${newTrait.name} = ${hasPrereqsForTrait}`);
		while (alreadyHasTrait && (!traitIsOkToRepeat || !hasPrereqsForTrait)) {
			newTrait = await this.traits.pickTrait();
			alreadyHasTrait = currentTraits.includes(newTrait.name);
			traitIsOkToRepeat = this.traits.canRepeatTraits.includes(newTrait.name);
			hasPrereqsForTrait = await this.traits.hasPrerequisites(newTrait, currentTraits);
			console.log(`picked another new trait = ${JSON.stringify(newTrait)}`);
			console.log(`Already has trait ${newTrait.name} = ${alreadyHasTrait}`);
			console.log(`Has prereqs for trait ${newTrait.name} = ${hasPrereqsForTrait}`);
		}

		var newTraitName = newTrait.name;
		var att2Mod = null;
		if (newTrait.attributesToMod && newTrait.attributesToMod.length > 0) {
			var goingToMaxAttribute = true;
			var attValue = null;
			var newAttValue = null;
			while (goingToMaxAttribute) {
				var dieRoll = rollDie(newTrait.attributesToMod.length) - 1;
				att2Mod = newTrait.attributesToMod[dieRoll].toLowerCase();
				attValue = this.getAttributeValue(att2Mod);
				newAttValue = attValue + 1;
				if (newAttValue <= 16) {
					goingToMaxAttribute = false;
				}
			}
			console.log(`bumping origin attribute ${att2Mod} from ${attValue} to ${newAttValue}`);
			await this.setAttributeValue(att2Mod, newAttValue);
			let recheckAttrValue = this.getAttributeValue(att2Mod);
			console.log(`make sure it changed ${att2Mod} to ${attValue} to ${recheckAttrValue}`);
			newTraitName = `${newTrait.name}{${att2Mod}}`;
		}

		currentTraits.push(newTraitName);
		currentTraits.sort(this.compareTraits);
		await this.setState ({ traits : currentTraits});

		let tempAttributes = [];
		tempAttributes.push({ name : "Accuracy", value : this.state.accuracy});
		tempAttributes.push({ name : "Athletics", value : this.state.athletics});
		tempAttributes.push({ name : "Awareness", value : this.state.awareness});
		tempAttributes.push({ name : "Education", value : this.state.education});
		tempAttributes.push({ name : "Morale", value : this.state.morale});
		tempAttributes.push({ name : "Presence", value : this.state.presence});
		tempAttributes.push({ name : "Toughness", value : this.state.toughness});
		await this.setState ({ attributes : tempAttributes});
		await this.setState({ currentHP: this.state.toughness });

	}

	async doReroll() {
		let randomName = this.names.pickName();
		await this.setState({ name: randomName})
		await this.setState({ level: 1 });
		await this.setState({ accuracy: roll8Plus2d3() });
		console.log(`accuracy = ${this.state.accuracy}`);
		await this.setState({ athletics: roll8Plus2d3() });
		console.log(`athletics = ${this.state.athletics}`);
		await this.setState({ awareness: roll8Plus2d3() });
		console.log(`awareness = ${this.state.awareness}`);
		await this.setState({ education: roll8Plus2d3() });
		console.log(`education = ${this.state.education}`);
		await this.setState({ morale: roll8Plus2d3() });
		console.log(`morale = ${this.state.morale}`);
		await this.setState({ presence: roll8Plus2d3() });
		console.log(`presence = ${this.state.presence}`);
		await this.setState({ toughness: roll8Plus2d3() });
		console.log(`toughness = ${this.state.toughness}`);
		await this.setState({ currentMorale: this.state.morale });
		let myOrigin = this.origins.pickOrigin();
		console.log(`origin = ${myOrigin[0]}/${myOrigin[1]}`);
		await this.setState({ origin: myOrigin[0] });
		let originAttribute = myOrigin[1];
		let originalAttrValue = this.getAttributeValue(originAttribute);
		let newAttrValue = originalAttrValue + 1;
		console.log(`bumping origin attribute ${originAttribute} from ${originalAttrValue} to ${newAttrValue}`);
		await this.setAttributeValue(originAttribute, newAttrValue);
		let recheckAttrValue = this.getAttributeValue(originAttribute);
		console.log(`make sure it changed ${originAttribute} to ${originalAttrValue} to ${recheckAttrValue}`);
		let myBackground = this.backgrounds.pickBackground();
		console.log(`background = ${myBackground.getBackgroundName()}`);
		await this.setState({ background: myBackground.getBackgroundName() });
		let backgroundTraits = this.backgrounds.pickTraits(myBackground);
		console.log(`background traits = ${backgroundTraits}`);
		var randomProfession = this.professions.pickProfession();
		console.log(`profession = ${JSON.stringify(randomProfession)}`);
		await this.setState({ profession : randomProfession.name });
		let professionTraits = this.professions.pickTraits(randomProfession, backgroundTraits);
		console.log(`profession traits = ${professionTraits}`);
		let fullTraits = Array.prototype.concat(backgroundTraits, professionTraits);

		for (var i = 0; i < fullTraits.length; i++) {
			var traitName = fullTraits[i];
			var theTrait = this.traits.getTrait(traitName);
			if (theTrait.attributesToMod && theTrait.attributesToMod.length > 0) {
				var att2Mod = theTrait.attributesToMod[rollDie(theTrait.attributesToMod.length - 1)].toLowerCase();
				let attValue = this.getAttributeValue(att2Mod);
				let newAttValue = attValue + 1;
				await this.setAttributeValue(att2Mod, newAttValue);
				fullTraits[i] = `${fullTraits[i]}{${att2Mod}}`;
			}
		}
		fullTraits.sort(this.compareTraits);
		await this.setState ({ traits : fullTraits});

		let tempAttributes = [];
		tempAttributes.push({ name : "Accuracy", value : this.state.accuracy});
		tempAttributes.push({ name : "Athletics", value : this.state.athletics});
		tempAttributes.push({ name : "Awareness", value : this.state.awareness});
		tempAttributes.push({ name : "Education", value : this.state.education});
		tempAttributes.push({ name : "Morale", value : this.state.morale});
		tempAttributes.push({ name : "Presence", value : this.state.presence});
		tempAttributes.push({ name : "Toughness", value : this.state.toughness});
		await this.setState ({ attributes : tempAttributes});
		await this.setState({ currentHP: this.state.toughness });
	};

	clickReroll(el){
		el.click();
	}

	render() {
		return (
			<div key="container" className="dice-roll-container">
 				<div key="npc-container" className="npc-container">
					<h1>Aliens &amp; Asteroids NPC Details</h1>
					<div className="row">
						<Field label="Character:" value={this.state.name}/>
						<Field label="Player:" value={this.state.player}/>
					</div> 
					<div className="row">
						<Field label="Origin:" value={this.state.origin}/>
						<Field label="Background:" value={this.state.background}/>
					</div> 
					<div className="row">
						<Field label="Career Path:" value={this.state.profession}/>
						<Field label="Level:" value={this.state.level}/>
					</div> 
					<div><hr className="theline"/></div>
					<div className="row">
						<div className="left">
							<h3>Attributes (2d3+8)</h3>
							<AttributeList attributes={this.state.attributes}/>
						</div>
						<div className="right">
							<h3>Traits:</h3>
							<TraitList traits={this.state.traits} />
						</div>
					</div> 
					<div><hr className="theline"/></div>
					<div className="centered">
						<Field label="Current HP:" value={this.state.currentHP}/>
						<Field label="Current Morale:" value={this.state.currentMorale}/>
					</div> 
					<div><hr className="theline"/></div>
					<button className="button" id="rollNPCbutton" onClick={this.doReroll} ref={this.clickReroll}>Roll NPC</button>
					<button className="button" id="addLevelButton" onClick={this.addLevel}>Add Level</button>
				</div>
			</div>
		);
	}
}

render( 
	<DieRollerForm key='main'/>,
	document.getElementById('root')
);

