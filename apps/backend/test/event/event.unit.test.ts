import { beforeEach, describe, expect, it, vi } from "vitest";
import { eventService } from "../../src/modules/event/event.service";
import { buildTrackEventInput } from "../setup/factories";
import { DuplicateResourceError, ResourceNotFoundError } from "../../src/errors/domain.errors";

const client = {};
const txManager = {
  run: vi.fn()
};

const repo = {
  findWebsite: vi.fn(),
  upsertVisitor: vi.fn(),
  upsertSession: vi.fn(),
  insertEvent: vi.fn()
};

const service = eventService(txManager, repo);

const input = buildTrackEventInput();

describe("eventService.track", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    txManager.run.mockImplementation((fn) => fn(client));
    repo.findWebsite.mockResolvedValue(true);
    repo.insertEvent.mockResolvedValue(false);
    repo.upsertSession.mockResolvedValue(true);
  });

  it("runs all repository calls inside one transaction", async () => {
    await service.track(input);

    expect(txManager.run).toHaveBeenCalledOnce();
    expect(repo.findWebsite).toHaveBeenCalledWith(client, input.websiteId);
    expect(repo.upsertVisitor).toHaveBeenCalledWith(client, input);
    expect(repo.upsertSession).toHaveBeenCalledWith(client, input);
  });

  it("throws and writes nothing when the website does not exist", async () => {
    repo.findWebsite.mockResolvedValue(false);

    await expect(service.track(input)).rejects.toThrow(ResourceNotFoundError);
    expect(repo.upsertVisitor).not.toHaveBeenCalled();
    expect(repo.upsertSession).not.toHaveBeenCalled();
    expect(repo.insertEvent).not.toHaveBeenCalled();
  });

  it("throws before inserting the event when the session does not belong to the visitor", async () => {
    repo.upsertSession.mockResolvedValue(false);

    await expect(service.track(input)).rejects.toThrow(DuplicateResourceError);
    expect(repo.insertEvent).not.toHaveBeenCalled();
  });

  it("reports whether the event was a duplicate", async () => {
    repo.insertEvent.mockResolvedValueOnce(true);

    await expect(service.track(input)).resolves.toEqual({ accepted: true, duplicate: true });
  });
});
