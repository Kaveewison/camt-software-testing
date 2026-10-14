// Fakes: working repositories kept in memory, no database.
// They must behave like the Pg versions, including the ORDER BY of each query.
import { Candidate, District, Party } from '../../src/domain/types';
import { CandidateRepository, NewCandidate } from '../../src/repositories/candidateRepository';
import { DistrictRepository } from '../../src/repositories/districtRepository';
import { NewParty, PartyRepository } from '../../src/repositories/partyRepository';

export class InMemoryDistrictRepository implements DistrictRepository {
  private readonly districts: District[];

  constructor(districts: District[] = []) {
    this.districts = [...districts];
  }

  async findAll(): Promise<District[]> {
    // ORDER BY province, number
    return [...this.districts].sort((a, b) => a.province.localeCompare(b.province) || a.number - b.number);
  }

  async findById(id: string): Promise<District | null> {
    return this.districts.find((d) => d.id === id) ?? null;
  }
}

export class InMemoryPartyRepository implements PartyRepository {
  private readonly parties: Party[] = [];
  private nextId = 1;

  async findAll(): Promise<Party[]> {
    // ORDER BY name
    return [...this.parties].sort((a, b) => a.name.localeCompare(b.name));
  }

  async findById(id: number): Promise<Party | null> {
    return this.parties.find((p) => p.id === id) ?? null;
  }

  async findByName(name: string): Promise<Party | null> {
    return this.parties.find((p) => p.name === name) ?? null;
  }

  async create(party: NewParty): Promise<Party> {
    const created = { ...party, id: this.nextId++ };
    this.parties.push(created);
    return created;
  }
}

export class InMemoryCandidateRepository implements CandidateRepository {
  private readonly candidates: Candidate[] = [];
  private nextId = 1;

  /** Needs the parties to fill in partyName, like the JOIN in the Pg version. */
  constructor(private readonly parties: PartyRepository) {}

  async findByDistrict(districtId: string): Promise<Candidate[]> {
    // WHERE district_id = $1 ORDER BY number
    return this.candidates.filter((c) => c.districtId === districtId).sort((a, b) => a.number - b.number);
  }

  async findByParty(partyId: number): Promise<Candidate[]> {
    // WHERE party_id = $1 ORDER BY district_id, number
    return this.candidates
      .filter((c) => c.partyId === partyId)
      .sort((a, b) => a.districtId.localeCompare(b.districtId) || a.number - b.number);
  }

  async create(candidate: NewCandidate): Promise<Candidate> {
    const party = await this.parties.findById(candidate.partyId);
    if (!party) throw new Error(`party ${candidate.partyId} does not exist`); // FOREIGN KEY in the real table

    const created = { ...candidate, id: this.nextId++, partyName: party.name };
    this.candidates.push(created);
    return created;
  }
}
